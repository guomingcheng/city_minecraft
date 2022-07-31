// SPDX-License-Identifier: Unlicensed

pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppeli n/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface ISwapFeeRewardWithRB {
    function accrueRBFromAuction(
        address account,
        address fromToken,
        uint256 amount
    ) external;
}

contract Auction is ReentrancyGuard, Ownable, Pausable, IERC721Receiver {
    using SafeERC20 for IERC20;

    // 订单的状态
    enum State {
        ST_OPEN,                    // 正在出售的订单
        ST_FINISHED,                // 已经成交的订单
        ST_CANCELLED                // 取消的订单
    }

    // 出售的 nft
    struct TokenPair {
        IERC721 nft;                // nft 合约地址
        uint256 tokenId;            // nft token id
    }

    // 订单
    struct Inventory {
        TokenPair pair;             // 出售的 nft 
        address seller;             // 卖方
        address bidder;             // 买方
        IERC20 currency;            // 交易的 TOKEN
        uint256 askPrice;           // 初始价格
        uint256 bidPrice;           // 最后投标的价格
        uint256 netBidPrice;        // 最后投标的价格 * 95 / 100 == 卖方实际收到的资金    
        uint256 startBlock;         // 启动的时间
        uint256 endTimestamp;       // 结束的时间
        State status;               // 订单的状态
    }

    // 版税
    struct RoyaltyStr {
        uint32 rate;                // 交易资金收取的比例
        address receiver;           // 收取版税存放的地址
        bool enable;                // 是否收取
    }

    event NFTBlacklisted(IERC721 nft, bool whitelisted);
    event NewAuction(
        uint256 indexed id,
        address indexed seller,
        IERC20 currency,
        uint256 askPrice,
        uint256 endTimestamp,
        TokenPair pair
    );
    event NewBid(
        uint256 indexed id,
        address indexed bidder,
        uint256 price,
        uint256 netPrice,
        uint256 endTimestamp
    );
    event AuctionCancelled(uint256 indexed id);
    event AuctionFinished(uint256 indexed id, address indexed winner);
    event NFTAccrualListUpdate(address nft, bool state);
    event SetRoyalty(
        address nftAddress,
        address royaltyReceiver,
        uint32 rate,
        bool enable
    );

    bool internal _canReceive = false;
    Inventory[] public auctions;
    //    mapping(uint256 => mapping(uint256 => TokenPair)) public auctionNfts; delete

    mapping(IERC721 => bool) public nftBlacklist;                                       // 设置 nft 合约黑名单
    mapping(address => bool) public nftForAccrualRB;                                    // 设置 nft 合约地址在市场上达成交易，是否给用户奖励能量值 RB
    mapping(IERC20 => bool) public dealTokensWhitelist;                                 // 设置市场交易可以支付的白名单列表 Token
    mapping(IERC721 => mapping(uint256 => uint256)) public auctionNftIndex; // nft -> tokenId -> id
    mapping(address => uint256) public userFee;                                         // 设置用户交易的需要扣除的手续费，如果为 0，就使用默认的手续费
    mapping(address => RoyaltyStr) public royalty; //Royalty for NFT creator. NFTToken => royalty (base 10000)


    uint256 constant MAX_DEFAULT_FEE = 1000; // max fee 10%
    address public treasuryAddress;
    uint256 public defaultFee = 100; //in base 10000 1%                                 // 在市场上交易默认支付的手续费

    uint256 public extendEndTimestamp; // in seconds                                    // 订单投标前 6 小时
    uint256 public minAuctionDuration;                                                  // nft token id 上架市场的投标最小时间                                  
    uint256 public prolongationTime; // in seconds


    uint256 public rateBase;                                                            // 100% 这个值等于价格的百分比        
    uint256 public bidderIncentiveRate;                                                 // 扣除最新投标价格的百分比，给上次投标的用户                
    uint256 public bidIncrRate;                                                         // 每次出价都在投标的价格上增长的百分比
    ISwapFeeRewardWithRB feeRewardRB;
    bool public feeRewardRBIsEnabled = true;                                            // 如果为 true, 在 nftForAccrualRB 字段设置的 nft 合约，成交后会给用户奖励能量值 RB

    constructor(
        uint256 extendEndTimestamp_,
        uint256 prolongationTime_,
        uint256 minAuctionDuration_,
        uint256 rateBase_,
        uint256 bidderIncentiveRate_,
        uint256 bidIncrRate_,        address treasuryAddress_,
        ISwapFeeRewardWithRB feeRewardRB_
    ) {
        extendEndTimestamp = extendEndTimestamp_;
        prolongationTime = prolongationTime_;
        minAuctionDuration = minAuctionDuration_;
        rateBase = rateBase_;
        bidderIncentiveRate = bidderIncentiveRate_;
        bidIncrRate = bidIncrRate_;
        treasuryAddress = treasuryAddress_;
        feeRewardRB = feeRewardRB_;

        auctions.push(
            Inventory({
                pair: TokenPair(IERC721(address(0)), 0),
                seller: address(0),
                bidder: address(0),
                currency: IERC20(address(0)),
                askPrice: 0,
                bidPrice: 0,
                netBidPrice: 0,
                startBlock: 0,
                endTimestamp: 0,
                status: State.ST_CANCELLED
            })
        );
    }

    function updateSettings(
        uint256 extendEndTimestamp_,
        uint256 prolongationTime_,
        uint256 minAuctionDuration_,
        uint256 rateBase_,
        uint256 bidderIncentiveRate_,
        uint256 bidIncrRate_,
        address treasuryAddress_,
        ISwapFeeRewardWithRB _feeRewardRB
    ) public onlyOwner {
        prolongationTime = prolongationTime_;
        extendEndTimestamp = extendEndTimestamp_;
        minAuctionDuration = minAuctionDuration_;
        rateBase = rateBase_;
        bidderIncentiveRate = bidderIncentiveRate_;
        bidIncrRate = bidIncrRate_;
        treasuryAddress = treasuryAddress_;
        feeRewardRB = _feeRewardRB;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function addWhiteListDealTokens(IERC20[] calldata _tokens)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _tokens.length; i++) {
            require(address(_tokens[i]) != address(0), "Address cant be 0");
            dealTokensWhitelist[_tokens[i]] = true;
        }
    }

    function delWhiteListDealTokens(IERC20[] calldata _tokens)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _tokens.length; i++) {
            delete dealTokensWhitelist[_tokens[i]];
        }
    }

    function blacklistNFT(IERC721 nft) public onlyOwner {
        nftBlacklist[nft] = true;
        emit NFTBlacklisted(nft, true);
    }

    function unblacklistNFT(IERC721 nft) public onlyOwner {
        delete nftBlacklist[nft];
        emit NFTBlacklisted(nft, false);
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
    }

    function setDefaultFee(uint256 _newFee) public onlyOwner {
        require(
            _newFee <= MAX_DEFAULT_FEE,
            "New fee must be less than or equal to max fee"
        );
        defaultFee = _newFee;
    }

    function enableRBFeeReward() public onlyOwner {
        feeRewardRBIsEnabled = true;
    }

    function disableRBFeeReward() public onlyOwner {
        feeRewardRBIsEnabled = false;
    }

    function setRoyalty(
        address nftAddress,
        address royaltyReceiver,
        uint32 rate,
        bool enable
    ) public onlyOwner {
        require(nftAddress != address(0), "Address cant be zero");
        require(royaltyReceiver != address(0), "Address cant be zero");
        require(rate < 10000, "Rate must be less than 10000");
        royalty[nftAddress].receiver = royaltyReceiver;
        royalty[nftAddress].rate = rate;
        royalty[nftAddress].enable = enable;
        emit SetRoyalty(nftAddress, royaltyReceiver, rate, enable);
    }

    // public

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override whenNotPaused returns (bytes4) {
        if (data.length > 0) {
            require(operator == from, "caller should own the token");
            require(!nftBlacklist[IERC721(msg.sender)], "token not allowed");
            (IERC20 currency, uint256 askPrice, uint256 endTimestamp) = abi
                .decode(data, (IERC20, uint256, uint256));
            TokenPair memory pair = TokenPair({
                nft: IERC721(msg.sender),
                tokenId: tokenId
            });
            _sell(from, pair, currency, askPrice, endTimestamp);
        } else {
            require(_canReceive, "cannot transfer directly");
        }

        return this.onERC721Received.selector;
    }


    /**
     * @dev 卖出 nft token id
     * @param pair              出售的 nft token id
     * @param currency          要支付的 token 
     * @param askPrice          初始价格
     * @param endTimestamp      投标结束的时间
     **/
    function sell(TokenPair calldata pair,IERC20 currency,uint256 askPrice,uint256 endTimestamp) public 
                                                nonReentrant                // 防止重入
                                                whenNotPaused               // 可设置暂停
                                                _waitForTransfer 
                                                notContract                 // 不能是合约发起的交易
    {
        // nft 合约地址不能等于 0 地址
        require(address(pair.nft) != address(0), "Address cant be zero");

        // nft 合约不能是黑名单列表中
        require(!nftBlacklist[pair.nft], "token not allowed");
        // 校验这个 nft token id 的拥有者是否是 msg.sender, 与是否授权给了市场合约
        require(
            _isTokenOwnerAndApproved(pair.nft, pair.tokenId),
            "token not approved"
        );
        // 把这个 nft 转入到市场合约中
        pair.nft.safeTransferFrom(msg.sender, address(this), pair.tokenId);
        // 出售
        _sell(msg.sender, pair, currency, askPrice, endTimestamp);
    }

    /**
     * @dev 卖出 nft token id
     * @param seller            订单的拥有者
     * @param pair              出售的 nft token id
     * @param currency          要支付的 token 
     * @param askPrice          初始价格
     * @param endTimestamp      投标结束的时间
     **/
    function _sell(
        address seller,
        TokenPair memory pair,
        IERC20 currency,
        uint256 askPrice,
        uint256 endTimestamp
    ) internal _allowedDealToken(currency) {                            // 交易这个交易的 token 是否在白名单中

        // 初始的价格必须的大于 0
        require(askPrice > 0, "askPrice > 0");
        // 结束时间，必须大于市场合约设置的最小时间
        require(
            endTimestamp >= block.timestamp + minAuctionDuration,
            "auction duration not long enough"
        );

        // 获取这个下标
        uint256 id = auctions.length;

        auctions.push(
            Inventory({
                pair: pair,                         // 出售的 nft
                seller: seller,                     // 订单的拥有者
                bidder: address(0),                 // 订单投标最后一个出价者
                currency: currency,                 // 支付的 Token
                askPrice: askPrice,                 // 初始价格
                bidPrice: 0,                        // 投标最后的价格
                netBidPrice: 0,                     // 投标最后的价格并扣除 5% 比例
                startBlock: block.number,           // 开始的区块
                endTimestamp: endTimestamp,         // 结束的区块
                status: State.ST_OPEN               // 订单的状态
            })
        );

        // 这个 nft token id 指向一个订单 ID
        auctionNftIndex[pair.nft][pair.tokenId] = id;
        // 触发创建订单的事件
        emit NewAuction(id, seller, currency, askPrice, endTimestamp, pair);
    }

    /**
     * @dev 投标
     * @param id        投标的订单
     @ @param offer     报出价格
     **/
    function bid(uint256 id, uint256 offer)
        public
        _hasAuction(id)                             // 校验这个订单 ID 是否是有效的
        _isStOpen(id)                               // 这个订单状态必须是上架中                
        nonReentrant                                // 防止重入            
        whenNotPaused                               // 可设置暂停
        notContract                                 // 不能是合约发起的交易
    {

        // 获取订单的详情
        Inventory storage inv = auctions[id];
        // 当前时间必须是小于订单的结束时间才能投标
        require(block.timestamp < inv.endTimestamp, "auction finished");

        // 这次投标的价格必须大于等于订单的最新价格
        require(offer >= getMinBidPrice(id), "offer not enough");
        // 把用户投标的价格转移到市场合约中
        inv.currency.safeTransferFrom(msg.sender, address(this), offer);

        // transfer some to previous bidder
        uint256 incentive = 0;
        // 当这俩个条件都满足，就表示这次投标的用户不是第一个，那么就需要为前面的用户返回投标付出的资金
        if (inv.netBidPrice > 0 && inv.bidder != address(0)) {
            // 获取这次投标的价格百分比
            incentive = (offer * bidderIncentiveRate) / rateBase;
            // 向上次用户发送投标的资金，并加上这次投标资金的 5% 资金，重这里看，投标在前面如果有人接盘也是有收益的
            _transfer(inv.currency, inv.bidder, inv.netBidPrice + incentive);
        }

        // 订单重新指向最新的投标价格
        inv.bidPrice = offer;
        // 记录扣除 5% 后的投标价格
        inv.netBidPrice = offer - incentive;
        // 投标用户指向最新消息发送者
        inv.bidder = msg.sender;

        // 如果着次的投标在订单结束的 6 个小时内，那么就把订单结束的时间延长 15 分钟
        if (block.timestamp + extendEndTimestamp >= inv.endTimestamp) {
            // 延长 15 分钟
            inv.endTimestamp += prolongationTime;
        }
        // 触发投标时间
        emit NewBid(id, msg.sender, offer, inv.netBidPrice, inv.endTimestamp);
    }

    /**
     * @dev 订单取消
     **/
    function cancel(uint256 id)
        public
        _hasAuction(id)                             // 校验这个订单 ID 是否是有效的
        _isStOpen(id)                               // 这个订单状态必须是上架中         
        _isSeller(id)                               // 校验订单的拥有者是否是 msg.sender
        nonReentrant                                // 防止重入    
        whenNotPaused                               // 可设置暂停
        notContract                                 // 不能是合约发起的交易        
    {
        // 获取订单的详情
        Inventory storage inv = auctions[id];
        // 投标地址必须等于 0，订单如果有了投标者，就不能撤销了
        require(inv.bidder == address(0), "has bidder");
        // 执行撤销
        _cancel(id);
    }

    /**
     * @dev 执行撤销
     **/
    function _cancel(uint256 id) internal {
        // 获取订单的详情
        Inventory storage inv = auctions[id];

        // 把订单的状态更改为取消
        inv.status = State.ST_CANCELLED;
        // 转回出售的 nft token id
        _transferInventoryTo(id, inv.seller);
        // 删除这个 nft token id 的订单记录
        delete auctionNftIndex[inv.pair.nft][inv.pair.tokenId];
        // 触发订单取消事件
        emit AuctionCancelled(id);
    }

    /**
     * @dev 批量的撤销或者结算订单
     **/
    function collect(uint256[] calldata ids) public nonReentrant whenNotPaused {
        for (uint256 i = 0; i < ids.length; i++) {
            _collectOrCancel(ids[i]);
        }
    }


    /**
     * @dev 撤销或者结算订单
     **/
    function _collectOrCancel(uint256 id)
        internal
        _hasAuction(id)                             // 校验这个订单 ID 是否是有效的
        _isStOpen(id)                               // 这个订单状态必须是上架中              
    {
        // 获取订单的信息
        Inventory storage inv = auctions[id];
        // 当前时间必须小于订单的结束时间
        require(block.timestamp >= inv.endTimestamp, "auction not done yet");
        // 投标地址必须等于 0，订单如果有了投标者，就不能撤销了
        if (inv.bidder == address(0)) {
            // 如果投标者等于 0， 就撤销订单
            _cancel(id);
        } else {
            // 接结算订单
            _collect(id);
        }
    }

    /**
     * @dev 卖方达成交易
     **/
    function _collect(uint256 id) internal {
        // 获取订单详情
        Inventory storage inv = auctions[id];

        // 获取这个用户需要支付的手续费
        uint256 feeRate = userFee[inv.seller] == 0
            ? defaultFee
            : userFee[inv.seller];
        // 获取手续费的数值
        uint256 fee = (inv.netBidPrice * feeRate) / 10000;

        // 如果手续费大于 0，就执行内部模块
        if (fee > 0) {
            // 把手续费转入国库地址
            _transfer(inv.currency, treasuryAddress, fee);
            // 如果这个俩个都为 true, 那么就需要给卖、买方奖励能量值
            if (
                feeRewardRBIsEnabled && nftForAccrualRB[address(inv.pair.nft)]
            ) {
                // 买方享有 50% 的手续费能量值
                feeRewardRB.accrueRBFromAuction(
                    inv.bidder,
                    address(inv.currency),
                    fee / 2
                );
                // 卖方享有 50% 的手续费能量值
                feeRewardRB.accrueRBFromAuction(
                    inv.seller,
                    address(inv.currency),
                    fee / 2
                );
            }
        }
        // 记录版税的数值
        uint256 royaltyFee = 0;
        // 如果这个 nft 收取版税的话，还要为扣除版税的金额，才到卖方用户的手上
        if(royalty[address(inv.pair.nft)].enable){
            // 获取版税的数值
            royaltyFee = (inv.netBidPrice * royalty[address(inv.pair.nft)].rate) / 10000;
            // 把版税发送到设置的地址
            _transfer(inv.currency, royalty[address(inv.pair.nft)].receiver, royaltyFee);
        }

        // 向用户转入剩余的资金
        _transfer(inv.currency, inv.seller, inv.netBidPrice - fee - royaltyFee);
        // 把订单的状态更改为成交状态
        inv.status = State.ST_FINISHED;
        // 向投标者转入命中的 nft token id
        _transferInventoryTo(id, inv.bidder);

        // 触发订单成功的事件
        emit AuctionFinished(id, inv.bidder);
    }

    // 校验订单是否还能投标的状态中
    function isOpen(uint256 id) public view _hasAuction(id) returns (bool) {
        Inventory storage inv = auctions[id];
        return
            inv.status == State.ST_OPEN && block.timestamp < inv.endTimestamp;
    }

    // 校验订单 ID 是否有效的，并校验订单是否还能投标的状态中
    function isCollectible(uint256 id)
        public
        view
        _hasAuction(id)
        returns (bool)
    {
        Inventory storage inv = auctions[id];
        return
            inv.status == State.ST_OPEN && block.timestamp >= inv.endTimestamp;
    }

    // 校验订单的数据是否还是和上架时一样的
    function isCancellable(uint256 id)
        public
        view
        _hasAuction(id)
        returns (bool)
    {
        Inventory storage inv = auctions[id];
        return inv.status == State.ST_OPEN && inv.bidder == address(0);
    }

    // 获取订单的长度
    function numAuctions() public view returns (uint256) {
        return auctions.length;
    }
    

    // 获取这个订单的最新价格
    function getMinBidPrice(uint256 id) public view returns (uint256) {

        // 获取订单的详情
        Inventory storage inv = auctions[id];

        // 如果 bidPrice 价格等于 0，就表示还没有人投标，返回初始价格即可
        if (inv.bidPrice == 0) {
            return inv.askPrice;
        } else {
            // 如果不是第一个出价，那么就在投标的原基础上增长的 bidIncrRate 百分比
            return inv.bidPrice + (inv.bidPrice * bidIncrRate) / rateBase;
        }
    }

    // internal

    modifier _isStOpen(uint256 id) {
        require(
            auctions[id].status == State.ST_OPEN,
            "auction finished or cancelled"
        );
        _;
    }

    // 校验这个订单 ID 是否是有效的
    modifier _hasAuction(uint256 id) {
        require(id > 0 && id < auctions.length, "auction does not exist");
        _;
    }

    // 校验订单的拥有者是否等于 msg.sender
    modifier _isSeller(uint256 id) {
        require(auctions[id].seller == msg.sender, "caller is not seller");
        _;
    }

    // 校验这个 token 是否在白名单列表中
    modifier _allowedDealToken(IERC20 token) {
        require(dealTokensWhitelist[token], "currency not allowed");
        _;
    }

    modifier _waitForTransfer() {
        _canReceive = true;
        _;
        _canReceive = false;
    }

    // 校验发送者不能是合约地址
    modifier notContract() {
        require(!_isContract(msg.sender), "Contract not allowed");
        require(msg.sender == tx.origin, "Proxy contract not allowed");
        _;
    }

    // 转账
    function _transfer(
        IERC20 currency,
        address to,
        uint256 amount
    ) internal {
        require(amount > 0 && to != address(0), "Wrong amount or dest address");
        currency.safeTransfer(to, amount);
    }

    // 校验 nft token id 的拥有者必须是 msg.sender, 与把 nft token id 授权给了市场合约
    function _isTokenOwnerAndApproved(IERC721 token, uint256 tokenId)
        internal
        view
        returns (bool)
    {
        return
            (token.ownerOf(tokenId) == msg.sender) &&
            (token.getApproved(tokenId) == address(this) ||
                token.isApprovedForAll(msg.sender, address(this)));
    }

    // 把出售的 nft token id 转回给订单的拥有者
    function _transferInventoryTo(uint256 id, address to) internal {
        Inventory storage inv = auctions[id];
        inv.pair.nft.safeTransferFrom(address(this), to, inv.pair.tokenId);
    }

    // 校验一个是否是合约地址
    function _isContract(address _addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_addr)
        }
        return size > 0;
    }
}