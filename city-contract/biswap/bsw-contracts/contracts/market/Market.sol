// SPDX-License-Identifier: Unlicensed
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


interface ISwapFeeRewardWithRB {
    function accrueRBFromMarket(
        address account,
        address fromToken,
        uint256 amount
    ) external;
}

interface ISmartChefMarket {
    function updateStakedTokens(address _user, uint256 amount) external;
}

//BSW, BNB, WBNB, BUSD, USDT
contract Market is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    /**
     * 订单的类型 
     **/
    enum Side {
        Sell,       // 卖 
        Buy         // 买
    }

    /**
     * 订单的状态
     **/
    enum OfferStatus {
        Open,           // 正在售卖的订单
        Accepted,       // 达成交易的订单   
        Cancelled       // 取消的订单
    }

    /**
     * NFT 的版税拥有者
     **/
    struct RoyaltyStr {
        uint32 rate;            // 收取交易额的比例
        address receiver;       // 交易的版税存放地址
        bool enable;            // 是否收取版税
    }

    uint256 constant MAX_DEFAULT_FEE = 1000;                // 最高费用 10%（基数10000）
    uint256 public defaultFee = 100;                        // 市场上交易的 nft token id 需要支付的手续费，默认是 1%
    uint8 public maxUserTokenOnSellToReward = 3;            // 为用户记录能量值的最大数值，当用户在市场上 3 次内使用市场出售 nft token id 就会为用户记录能量值
    uint256 rewardDistributionSeller = 50;                  // 当用户达成交易时，买方与卖方各分享手续费的 50% 的能量值
    address public treasuryAddress;                         // 国库地址，市场收取的手续费存放在这里
    ISwapFeeRewardWithRB feeRewardRB;
    ISmartChefMarket smartChefMarket;
    bool feeRewardRBIsEnabled = false;                      // 启用 / 禁用 nftForAccrualRB 列表中交易NFT令牌的累积RB奖励
    bool placementRewardEnabled = false;                    // 当设置为 true 的时候，在 nftForAccrualRB 字段设置为 true 的 nft，在市场上交易就会产出能量 RB

    // 存放所有订单的集合
    Offer[] public offers;
    // NFT 卖单存放的集合， nft 合约 ==> nft token id ==> 订单的下标
    mapping(IERC721 => mapping(uint256 => uint256)) public tokenSellOffers; // nft => tokenId => id
    // NFT 买单存放的集合， user address ==> nft ==> nft token id ==> 订单的下标
    mapping(address => mapping(IERC721 => mapping(uint256 => uint256))) public userBuyOffers; // user => nft => tokenId => id
    mapping(address => bool) public nftBlacklist;           // 在交易市场设置 nft 合约黑名单，一旦设置就不能上架平台
    mapping(address => bool) public nftForAccrualRB;        // 这里设置的 nft 合约为 true, 当用户在市场上交易就会产出能量值 RB

    mapping(address => bool) public dealTokensWhitelist;    // 交易节煤白名单，这里设置的 erc20 token 可用于支付 nft 购买的金额
    mapping(address => uint256) public userFee;             // 用户在市场上交易的 nft token id 需要支付的手续费设置，如果为 0，那么就使用默认的手续费数值
    mapping(address => uint256) public tokensCount;         // 用户在市场上出售 nft token id 的次数
    mapping(address => RoyaltyStr) public royalty;          // NFT创建者的版税。NFTToken=>版税（基数10000）

    // NFT 交易记录
    struct Offer {
        uint256 tokenId;       // nft token id
        uint256 price;         // nft tokne id 的价格
        IERC20 dealToken;      // 需要支付的 ERC20 的 token 
        IERC721 nft;           // nft 合约地址 
        address user;          // 订单拥有者 
        address acceptUser;    // 订单撮合者 
        OfferStatus status;    // 订单的状态
        Side side;             // 订单的类型，分别是买、卖 
    }

    event NewOffer(                                                                             // 构建一笔订单时触发的事件
        address indexed user,
        IERC721 indexed nft,
        uint256 indexed tokenId,
        address dealToken,
        uint256 price,
        Side side,
        uint256 id
    );

    event CancelOffer(uint256 indexed id);
    event AcceptOffer(uint256 indexed id, address indexed user, uint256 price);
    event NewTreasuryAddress(address _treasuryAddress);
    event NFTBlackListUpdate(address nft, bool state);
    event NFTAccrualListUpdate(address nft, bool state);
    event DealTokensWhiteListUpdate(address token, bool whiteListed);
    event NewUserFee(address user, uint256 fee);
    event SetRoyalty(
        address nftAddress,
        address royaltyReceiver,
        uint32 rate,
        bool enable
    );

    /**
     * @dev 构造函数
     * @param _treasuryAddress      国库地址，交易的手续费存放在这里
     * @param _feeRewardRB          
     **/
    constructor(
        address _treasuryAddress,
        ISwapFeeRewardWithRB _feeRewardRB
    ) {
        // 国库的地址不能为空地址
        require(_treasuryAddress != address(0), "Address cant be zero");
        treasuryAddress = _treasuryAddress;
        feeRewardRB = _feeRewardRB;
        feeRewardRBIsEnabled = false;
        // take id(0) as placeholder
        offers.push(
            Offer({
                tokenId: 0,
                price: 0,
                nft: IERC721(address(0)),
                dealToken: IERC20(address(0)),
                user: address(0),
                acceptUser: address(0),
                status: OfferStatus.Cancelled,
                side: Side.Buy
            })
        );
    }


    /**
     * @dev 暂停市场合约
     **/
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev 取消暂停市场合约
     **/
    function unpause() public onlyOwner {
        _unpause();
    }

    function enableRBFeeReward() public onlyOwner {
        feeRewardRBIsEnabled = true;
    }

    function disableRBFeeReward() public onlyOwner {
        feeRewardRBIsEnabled = false;
    }

    function enablePlacementReward() public onlyOwner {
        placementRewardEnabled = true;
    }

    function disablePlacementReward() public onlyOwner {
        placementRewardEnabled = false;
    }

    /**
     * @dev 设置国库地址
     **/
    function setTreasuryAddress(address _treasuryAddress) public onlyOwner {
        //NFT-01
        require(_treasuryAddress != address(0), "Address cant be zero");
        treasuryAddress = _treasuryAddress;
        emit NewTreasuryAddress(_treasuryAddress);
    }

    function setRewardDistributionSeller(uint256 _rewardDistributionSeller)
        public
        onlyOwner
    {
        require(
            _rewardDistributionSeller <= 100,
            "Incorrect value Must be equal to or greater than 100"
        );
        rewardDistributionSeller = _rewardDistributionSeller;
    }

    /**
     * @dev 设置版税
     * @param nftAddress            设置版税的 NFT 合约地址
     * @param royaltyReceiver       版税收取存放的地址
     * @param rate                  版税收取交易金额的比例
     * @param enable                是否收取
     **/
    function setRoyalty(
        address nftAddress,
        address royaltyReceiver,
        uint32 rate,
        bool enable
    ) public onlyOwner {
        // nft 合约地址不能是空地址
        require(nftAddress != address(0), "Address cant be zero");
        // 版税存放地址不能是空地址
        require(royaltyReceiver != address(0), "Address cant be zero");
        // 收取的比例不能大于 100%，最大可以收取 100%
        require(rate < 10000, "Rate must be less than 10000");
        royalty[nftAddress].receiver = royaltyReceiver;
        royalty[nftAddress].rate = rate;
        royalty[nftAddress].enable = enable;
        emit SetRoyalty(nftAddress, royaltyReceiver, rate, enable);
    }

    /**
     * @dev 设置 nft 黑名单
     */
    function addBlackListNFT(address[] calldata nfts) public onlyOwner {
        for (uint256 i = 0; i < nfts.length; i++) {
            nftBlacklist[nfts[i]] = true;
            emit NFTBlackListUpdate(nfts[i], true);
        }
    }

    /**
     * @dev 解除 nft 黑名单
     */
    function delBlackListNFT(address[] calldata nfts) public onlyOwner {
        for (uint256 i = 0; i < nfts.length; i++) {
            delete nftBlacklist[nfts[i]];
            emit NFTBlackListUpdate(nfts[i], false);
        }
    }

    /**
     * @dev 设置结算代币的白名单
     */
    function addWhiteListDealTokens(address[] calldata _tokens)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != address(0), "Address cant be 0");
            dealTokensWhitelist[_tokens[i]] = true;
            emit DealTokensWhiteListUpdate(_tokens[i], true);
        }
    }

    /**
     * @dev 解除结算代币的白名单
     */
    function delWhiteListDealTokens(address[] calldata _tokens)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _tokens.length; i++) {
            delete dealTokensWhitelist[_tokens[i]];
            emit DealTokensWhiteListUpdate(_tokens[i], false);
        }
    }

    function addNftForAccrualRB(address _nft) public onlyOwner {
        require(_nft != address(0), "Address cant be zero");
        nftForAccrualRB[_nft] = true;
        emit NFTAccrualListUpdate(_nft, true);
    }

    function delNftForAccrualRB(address _nft) public onlyOwner {
        require(_nft != address(0), "Address cant be zero");
        delete nftForAccrualRB[_nft];
        emit NFTAccrualListUpdate(_nft, false);
    }

    function setUserFee(address user, uint256 fee) public onlyOwner {
        userFee[user] = fee;
        emit NewUserFee(user, fee);
    }

    function setDefaultFee(uint256 _newFee) public onlyOwner {
        require(
            _newFee <= MAX_DEFAULT_FEE,
            "New fee must be less than or equal to max fee"
        );
        defaultFee = _newFee;
    }

    function SetMaxUserTokenOnSellToReward(uint8 newCount) public onlyOwner {
        maxUserTokenOnSellToReward = newCount;
    }

    function setSmartChefMarket(ISmartChefMarket _smartChefMarket)
        public
        onlyOwner
    {
        require(address(_smartChefMarket) != address(0), "Address cant be 0");
        smartChefMarket = _smartChefMarket;
    }

    function setFeeRewardRB(ISwapFeeRewardWithRB _feeRewardRB)
        public
        onlyOwner
    {
        require(address(_feeRewardRB) != address(0), "Address cant be 0");
        feeRewardRB = _feeRewardRB;
    }


    /**
     * @dev 创建一个订单
     * @param Side                  订单的类型
     * @param dealToken             支付的 erc20 token
     * @param nft                   NFT 合约地址
     * @param tokenId               NFT token id
     * @param price                 价格
     **/
    function offer(
        Side side,
        address dealToken,
        IERC721 nft,
        uint256 tokenId,
        uint256 price
    )
        public
        nonReentrant                    // 防止重入
        whenNotPaused                   // 可暂停设置
        _nftAllowed(nft)                // 校验是否是黑名单内的 NFT
        _validDealToken(dealToken)      // 校验这个 NTF 结算的 Token 是否是白名单内的
        notContract                     // 不能是合约发起的交易
    {
        // 订单的类型是购买
        if (side == Side.Buy) {
            // 创建
            _offerBuy(nft, tokenId, price, dealToken);
        // 订单的类型是出售
        } else if (side == Side.Sell) {
            // 创建
            _offerSell(nft, tokenId, price, dealToken);
        } else {
            revert("Not supported");
        }
    }

    /**
     * @dev 购买或者出售市场上的 nft token id
     * @param id 订单的下标
     **/
    function accept(uint256 id)
        public
        nonReentrant                    // 防止重入          
        _offerExists(id)                // 校验订单的 ID 是否是一个有效的
        _offerOpen(id)                  // 校验订单的 ID 是否正在上架中
        _notBlackListed(id)             // 校验订单的 ID 中的 nft 合约是否在黑名单中
        whenNotPaused                   // 可暂停设置
        notContract                     // 不能是合约发起的交易 
    {

        // 如果订单的类型是购买，那么 msg.sender 就是出售 nft token id
        if (offers[id].side == Side.Buy) {
            // mag.sender 需要出售 nft token id 来达成订单交易
            _acceptBuy(id);
        // 如果顶的的类型是出售，那么 msg.sender 就是购买 nft token id
        } else {
            // mag.sender 需要购买 nft token id 来达成订单交易
            _acceptSell(id);
        }
    }


    /**
     * @dev 取消购买订单或者出售订单
     **/
    function cancel(uint256 id)
        public
        nonReentrant                    // 防止重入
        _offerExists(id)                // 校验订单的 ID 是否是一个有效的
        _offerOpen(id)                  // 校验订单的 ID 是否正在上架中
        _offerOwner(id)                 // 校验订单的拥有者是否是 msg.sender 
        whenNotPaused                   // 可暂停设置
    {
        // 检验订单的类型
        if (offers[id].side == Side.Buy) {
            // 取消购买订单
            _cancelBuy(id);
        } else {
            // 取消出售订单
            _cancelSell(id);
        }
    }

    /**
     * @dev 批量取消购买订单或者出售订单
     **/
    function multiCancel(uint256[] calldata ids) public notContract {
        for (uint256 i = 0; i < ids.length; i++) {
            cancel(ids[i]);
        }
    }

    //increase: true - increase token to accrue rewards; false - decrease token from
    /**
     * @dev 
     * @param increase      为 true 的时候，为用户记录能量值，false 的时候减去用户记录的能量值
     * @param user          用户地址
     * @param nftToken      nft 合约地址
     **/
    function placementRewardQualifier(
        bool increase,
        address user,
        address nftToken
    ) internal {

        // 当这个俩个值都为 true 的时候，用户在市场创建 nft token id 的交易就会产出能量值 RB
        if (!nftForAccrualRB[nftToken] || !placementRewardEnabled) return;
        // 如果 true, 需要为用户市场出售 nft token id 的次数加 1
        if (increase) {
            tokensCount[user]++;
        } else {
            // 否则就是减 1
            tokensCount[user] = tokensCount[user] > 0
                ? tokensCount[user] - 1
                : 0;
        }
        // 如果用户使用市场的次数超过设置最大的能量值记录值，就不会为用户这个行为来记录能量值了
        if (tokensCount[user] > maxUserTokenOnSellToReward) return;

        // 获取有效的次数
        uint256 stakedAmount = tokensCount[user] >= maxUserTokenOnSellToReward
            ? maxUserTokenOnSellToReward
            : tokensCount[user];
        smartChefMarket.updateStakedTokens(user, stakedAmount);
    }

    /**
     * @dev 创建一个卖出 nft token id 的订单
     * @param nft            nft 合约
     * @param tokenId        nft token id
     * @param price          价格
     * @param dealToken      交易的 token
     **/
    function _offerSell(
        IERC721 nft,
        uint256 tokenId,
        uint256 price,
        address dealToken
    ) internal {
        // 合约不接受主笔的发送
        require(msg.value == 0, "Seller should not pay");
        // 出售的价格必须大于 0
        require(price > 0, "price > 0");
        // 创建一个售卖 nft token id 的订单
        offers.push(
            Offer({
                tokenId: tokenId,                   // nft token id
                price: price,                       // 价格
                dealToken: IERC20(dealToken),       // 交易的 token
                nft: nft,                           // nft 合约地址
                user: msg.sender,                   // 订单的拥有者
                acceptUser: address(0),             // 订单成交者
                status: OfferStatus.Open,           // 订单的状态，上架中
                side: Side.Sell                     // 订单的类型，出售 nft token id
            })
        );

        // 获取这个订单的下标
        uint256 id = offers.length - 1;
        // 触发订单的创建事件
        emit NewOffer(
            msg.sender,
            nft,
            tokenId,
            dealToken,
            price,
            Side.Sell,
            id
        );

        // 校验 msg.sender 是否拥有对 nft token id 转移权限
        require(getTokenOwner(id) == msg.sender, "sender should own the token");
        // 校验 msg.sender 是否把这个 nft token id 授权给市场合约地址
        require(isTokenApproved(id, msg.sender), "token is not approved");

        // 如果这个 nft token id 有了上架过出售订单，那么就取消这个历史的记录
        if (tokenSellOffers[nft][tokenId] > 0) {
            // 取消 nft token id 的出售历史记录
            _closeSellOfferFor(nft, tokenId);
        } else {
            // 为这个出售 nft token id 用户计数使用市场增加
            placementRewardQualifier(true, msg.sender, address(nft));
        }
        // nft token id 重新指向一个新的订单 id
        tokenSellOffers[nft][tokenId] = id;
    }

    /**
     * @dev 创建一个购买 nft token id 的订单
     * @param nft               nft 合约地址
     * @param tokenID           nft token id
     * @param price             价格
     * @param dealtoken         交易的代币
     **/
    function _offerBuy(
        IERC721 nft,
        uint256 tokenId,
        uint256 price,
        address dealToken
    ) internal {

        // 先把用户要购买 nft token id 的资金转入到市场合约中
        IERC20(dealToken).safeTransferFrom(msg.sender, address(this), price);
        // 出价购买 nft token id 的价格必须是大于 0
        require(price > 0, "buyer should pay");

        // 创建一个购买 nft token id 的订单
        offers.push(
            Offer({
                tokenId: tokenId,                   // nft token id
                price: price,                       // 价格
                dealToken: IERC20(dealToken),       // 支付的 erc20 token
                nft: nft,                           // nft 合约
                user: msg.sender,                   // 订单的拥有者
                acceptUser: address(0),             // 订单撮合者，目前订单是刚创建，所有是没有
                status: OfferStatus.Open,           // 订单的状态，上架市场中
                side: Side.Buy                      // 订单的类型，购买
            })
        );

        // 获取这个订单的下标 ID
        uint256 id = offers.length - 1;
        // 先触发事件
        emit NewOffer(msg.sender, nft, tokenId, dealToken, price, Side.Buy, id);
        // 校验用户是否已经上架过 nft token id 的购买订单，如果有需要把上次标记的价格退回给用户
        _closeUserBuyOffer(userBuyOffers[msg.sender][nft][tokenId]);
        // 这个 nft token id 重新指向一个购买订单的 id
        userBuyOffers[msg.sender][nft][tokenId] = id;
    }

    /**
     * @dev 成交购买的订单
     **/
    function _acceptBuy(uint256 id) internal {
        // 获取订单详情
        Offer storage _offer = offers[id];
        // msg.sender 不能向合约发送主币
        require(msg.value == 0, "seller should not pay");

        // msg.sender 必须持有订单的中 nft token id 的转移权限
        require(getTokenOwner(id) == msg.sender, "only owner can call");
        // msg.sender 必须把订单中的 nft token id 授权给市场合约地址
        require(isTokenApproved(id, msg.sender), "token is not approved");
        // 把订单标记成成交状态
        _offer.status = OfferStatus.Accepted;
        // 设置订单成交者的地址
        _offer.acceptUser = msg.sender;

        // 把 nft token id 转给购买订单的拥有者，因为 user 已经支付了价格到市场合约中了
        _offer.nft.safeTransferFrom(msg.sender, _offer.user, _offer.tokenId);
        // 资金分配
        _distributePayment(_offer);

        // 触发订单达成的交易
        emit AcceptOffer(id, msg.sender, _offer.price);
        // 取消 nft tokne id 的购买订单
        _unlinkBuyOffer(_offer);
        // 如果这个 nft token id 也有售卖订单，那么也是需要取消
        if (tokenSellOffers[_offer.nft][_offer.tokenId] > 0) {
            // 取消订单
            _closeSellOfferFor(_offer.nft, _offer.tokenId);
            // 用户成功的购买订单，需要用户计数减一，当用户在 3 以内就会为用户记录市场交易挖矿
            placementRewardQualifier(false, msg.sender, address(_offer.nft));
        }
    }

    /** 
     * @dev 成交出售订单
     **/
    function _acceptSell(uint256 id) internal {
        // 获取订单详情
        Offer storage _offer = offers[id];

        // 校验用户
        if (
            // 如果这个出售订单的 nft token id 已经不属于订单的拥有者，那么就撤销这个 nft token id 的出售订单
            getTokenOwner(id) != _offer.user ||
            // 如果这个订单的 nft token id 不在授权给市场合约的状态，那么久撤销这个 nft token id 的出售订单
            isTokenApproved(id, _offer.user) == false
        ) {

            // 取消订单
            _cancelSell(id);
            return;
        }
        // 否则，就成功这个 nft token id 的交易

        // 把订单的状态更改为成交
        _offer.status = OfferStatus.Accepted;
        // 订单的成交者设置为 msg.sender
        _offer.acceptUser = msg.sender;
        // 把这个 nft token id 的出售订单，清除
        _unlinkSellOffer(_offer);

        // 先把购买者的前转入到市场合约中
        _offer.dealToken.safeTransferFrom(msg.sender, address(this), _offer.price);
        // 分配 msg.sender 支付的资金
        _distributePayment(_offer);
        // 把 nft token id 转给 msg.sender
        _offer.nft.safeTransferFrom(_offer.user, msg.sender, _offer.tokenId);
        // 触发成交订单事件
        emit AcceptOffer(id, msg.sender, _offer.price);
    }

    /**
     * @dev 撤销 nft token id 的出售订单
     **/
    function _cancelSell(uint256 id) internal {
        // 获取订单的详情
        Offer storage _offer = offers[id];
        // 订单的状态必须是上架中
        require(_offer.status == OfferStatus.Open, "Offer was cancelled");
        // 把订单的状态更改为取消
        _offer.status = OfferStatus.Cancelled;
        // 触发 nft token id 撤销状态
        emit CancelOffer(id);
        // 取消 nft token id 的订单
        _unlinkSellOffer(_offer);
    }

    /**
     * @dev 取消购买订单
     **/
    function _cancelBuy(uint256 id) internal {
        // 获取订单的详细信息
        Offer storage _offer = offers[id];
        // 订单的状态必须是上架中
        require(_offer.status == OfferStatus.Open, "Offer was cancelled");
        // 订单更改为取消
        _offer.status = OfferStatus.Cancelled;
        // 因为是购买订单，需要把用户标记的资金，转回给用户
        _transfer(msg.sender, _offer.price, _offer.dealToken);
        // 触发订单取消事件
        emit CancelOffer(id);
        // 取消 nft token id 的购买订单
        _unlinkBuyOffer(_offer);
    }

    // modifiers
    modifier _validDealToken(address _token) {
        require(dealTokensWhitelist[_token], "Deal token not available");
        _;
    }
    // 检验订单的 id 是否有效的
    modifier _offerExists(uint256 id) {
        require(id > 0 && id < offers.length, "offer does not exist");
        _;
    }

    // 校验订单的状态是否是上架中
    modifier _offerOpen(uint256 id) {
        require(offers[id].status == OfferStatus.Open, "offer should be open");
        _;
    }

    // 校验订单的拥有者是否是 msg.sender
    modifier _offerOwner(uint256 id) {
        require(offers[id].user == msg.sender, "call should own the offer");
        _;
    }

    // 校验订单的 id 中的 nft 合约是否黑名单中
    modifier _notBlackListed(uint256 id) {
        Offer storage _offer = offers[id];
        require(!nftBlacklist[address(_offer.nft)], "NFT in black list");
        _;
    }

    // 校验 nft 合约地址是否在黑名单中
    modifier _nftAllowed(IERC721 nft) {
        require(!nftBlacklist[address(nft)], "NFT in black list");
        _;
    }

    // 校验 msg.sender 不能是一个合约地址
    modifier notContract() {
        require(!_isContract(msg.sender), "Contract not allowed");
        require(msg.sender == tx.origin, "Proxy contract not allowed");
        _;
    }

    // 内部转账
    function _transfer(
        address to,
        uint256 amount,
        IERC20 _dealToken
    ) internal {
        require(amount > 0 && to != address(0), "Wrong amount or dest on transfer");
        _dealToken.safeTransfer(to, amount);
    }

    /**
     * @dev 交易金额分配
     **/
    function _distributePayment(Offer memory _offer) internal {

        // 把订单的卖方与买方，转换为正确，seller 是卖方，buyer 是买方
        (address seller, address buyer) = _offer.side == Side.Sell
            ? (_offer.user, _offer.acceptUser)
            : (_offer.acceptUser, _offer.user);
        // 获取用户需要支付的手续费
        uint256 feeRate = userFee[seller] == 0 ? defaultFee : userFee[seller];
        // 获取手续费的正确数值
        uint256 fee = (_offer.price * feeRate) / 10000;
        uint256 royaltyFee = 0;

        // 如果用户交易的 nft token id 还收取版税，那么用户还是扣除版税的价格，在到出售 nft token id 的手里
        if (royalty[address(_offer.nft)].enable) {
            // 获取版税的正确数值
            royaltyFee =
                (_offer.price * royalty[address(_offer.nft)].rate) /
                10000;
            // 向版税地址转入收取的资金
            _transfer(
                royalty[address(_offer.nft)].receiver,
                royaltyFee,
                _offer.dealToken
            );
        }
        // 向国库地址转入收取的手续费
        _transfer(treasuryAddress, fee, _offer.dealToken);
        // 向出售 nft token id 的用户转入剩余的资金
        _transfer(seller, _offer.price - fee - royaltyFee, _offer.dealToken);
        if (feeRewardRBIsEnabled && nftForAccrualRB[address(_offer.nft)]) {
            // 卖方获取手续费 50% 的能量值
            feeRewardRB.accrueRBFromMarket(
                seller,
                address(_offer.dealToken),
                (fee * rewardDistributionSeller) / 100
            );
            // 买方获取手续费 50% 的能量值
            feeRewardRB.accrueRBFromMarket(
                buyer,
                address(_offer.dealToken),
                (fee * (100 - rewardDistributionSeller)) / 100
            );
        }
    }

    /**
     * @dev 取消 nft token id 的出售订单
     **/
    function _closeSellOfferFor(IERC721 nft, uint256 tokenId) internal {
        // 如果等于 0， 就表示这个 nft token id 没有出售的历史
        uint256 id = tokenSellOffers[nft][tokenId];
        if (id == 0) return;

        // 那么就获取这个订单的详情
        Offer storage _offer = offers[id];
        // 订单的状态标记为取消
        _offer.status = OfferStatus.Cancelled;
        // 清除这个订单的 ID
        tokenSellOffers[_offer.nft][_offer.tokenId] = 0;
        // 触发取消订单事件
        emit CancelOffer(id);
    }

    /**
     * @dev 校验用户是否上架了这个 nft token id 的购买订单
     **/
    function _closeUserBuyOffer(uint256 id) internal {

        // 获取这个订单详情
        Offer storage _offer = offers[id];
        // 校验，如果 id 大于 0， 就表示用户已经上架过购买这个 nft token id 的订单了
        // 再次检验，订单的状态与类型是否分别是上架中，购买
        if (
            id > 0 &&
            _offer.status == OfferStatus.Open &&
            _offer.side == Side.Buy
        ) {
            // 当上面的条件都达成了，就需要处理这个订单的交易，因为用户已经重新对 nft token id 定价，需要把上次的出价退还给用户
            // 订单的状态标记为取消
            _offer.status = OfferStatus.Cancelled;
            // 把用户上次为这个 nft token id 标记的价格原路返回给用户
            _transfer(_offer.user, _offer.price, _offer.dealToken);
            // 取消 nft token id 的订单
            _unlinkBuyOffer(_offer);
            // 触发订单取消事件
            emit CancelOffer(id);
        }
    }

    /**
     * @dev 取消 nft token id 的购买订单
     **/
    function _unlinkBuyOffer(Offer storage o) internal {
        userBuyOffers[o.user][o.nft][o.tokenId] = 0;
    }

    /**
     * @dev 取消 nft token id 的售出订单
     **/
    function _unlinkSellOffer(Offer storage o) internal {
        // 为这个用户在市场上出售 nft 计数减一
        placementRewardQualifier(false, o.user, address(o.nft));
        // 取消
        tokenSellOffers[o.nft][o.tokenId] = 0;
    }

    // helpers

    // 校验这个订单 ID 是否还是有效的
    function isValidSell(uint256 id) public view returns (bool) {
        // 如果订单 ID 大于订单的长度，证明是一个无效的订单
        if (id >= offers.length) {
            return false;
        }

        Offer storage _offer = offers[id];
        // try to not throw exception
        return
            _offer.status == OfferStatus.Open &&                        // 订单的状态必须是上架中，不然就是无效的订单
            _offer.side == Side.Sell &&                                 // 订单的类型必须是出售，不然就是无效的订单
            isTokenApproved(id, _offer.user) &&                         // 市场合约是否拥有对这个订单 nft token id 转移权限，不然就是无效的订单    
            (_offer.nft.ownerOf(_offer.tokenId) == _offer.user);        // 订单中的 nft token id 拥有者是否等于订单的拥有者，不然就是无效的订单
    }

    // 校验订单中的 nft token id 是否授权给了市场合约地址，市场合约需要 nft token id 转移权限
    function isTokenApproved(uint256 id, address owner)
        public
        view
        returns (bool)
    {
        Offer storage _offer = offers[id];
        return
            _offer.nft.getApproved(_offer.tokenId) == address(this) ||
            _offer.nft.isApprovedForAll(owner, address(this));
    }

    // 获取订单中的 nft token id 现在的持有者
    function getTokenOwner(uint256 id) public view returns (address) {
        Offer storage _offer = offers[id];
        return _offer.nft.ownerOf(_offer.tokenId);
    }

    // 判断一个地址是否是合约地址
    function _isContract(address _addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_addr)
        }
        return size > 0;
    }
}