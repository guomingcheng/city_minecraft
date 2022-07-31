//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract BiswapNFT is Initializable, ERC721EnumerableUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {

    bytes32 public constant TOKEN_FREEZER = keccak256("TOKEN_FREEZER");                  // 冻结权限，持有这个权限可以冻结任意等级的 nft
    bytes32 public constant TOKEN_MINTER_ROLE = keccak256("TOKEN_MINTER");               // 铸币权限, 持有这个权限可以铸造 1 级的 nft
    bytes32 public constant LAUNCHPAD_TOKEN_MINTER = keccak256("LAUNCHPAD_TOKEN_MINTER");// 铸币权限，持有这个权限可以铸造任意等级的 nft
    bytes32 public constant RB_SETTER_ROLE = keccak256("RB_SETTER");                     // 能力值记录权限， 持有这个权限把能量值记录在合约中，可以让用户把能量值充值到 nft 属性中
    uint public constant MAX_ARRAY_LENGTH_PER_REQUEST = 30;                              // 入参的 nft token id 最多 30 十个   

    string private _internalBaseURI;            // URI
    uint8 private _levelUpPercent;              // 每升一级，在原基础上增幅百分比的能量值
    uint private _initialRobiBoost;             // NFT 第一级的能量值
    uint private _burnRBPeriod;                 // 记录用户能量值有效 _burnRBPeriod 天数

    uint[7] private _rbTable;                   // 定义了每一级的能量值最大值
    uint[7] private _levelTable;                // 定义了每升一级需要销毁多少 NFT
    uint private _lastTokenId;                  // nft 最高 id 值      

    struct Token {
        uint robiBoost;            // 能量值
        uint level;                // NFT 的级别
        bool stakeFreeze;          // 这个 NFT 是否冻结，如果冻结就不能执行任何操作
        uint createTimestamp;      // 创建的时间 
    }

    
    // 每个 nft token id 指向他的数据结构
    mapping(uint256 => Token) private _tokens;
    // user address ==> 这一天 ==> 能量值
    mapping(address => mapping(uint => uint)) private _robiBoost;    
    // 这一天 ==> 所有用户的能量值总和
    mapping(uint => uint) private _robiBoostTotalAmounts;

    event GainRB(uint indexed tokenId, uint newRB);
    event RBAccrued(address user, uint amount);
    event LevelUp(address indexed user, uint indexed newLevel, uint[] parentsTokensId);
    //BNF-01, SFR-01
    event Initialize(string baseURI, uint initialRobiBoost, uint burnRBPeriod);
    event TokenMint(address indexed to, uint indexed tokenId, uint level, uint robiBoost);

    function initialize(
        string memory baseURI,
        uint initialRobiBoost,
        uint burnRBPeriod
    ) public initializer {
        __ERC721_init("BiswapRobbiesEarn", "BRE");
        __ERC721Enumerable_init();
        __AccessControl_init_unchained();
        __ReentrancyGuard_init();

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);             // 管理权限，只有一个
        _internalBaseURI = baseURI;
        _initialRobiBoost = initialRobiBoost;                   // 第一级的 nft 能量值
        _levelUpPercent = 10; //10%
        _burnRBPeriod = burnRBPeriod;

        _rbTable[0] = 100 ether;
        _rbTable[1] = 10 ether;             // 从 1 级升到 2 级时需要支付的费用, 下面以此类推
        _rbTable[2] = 100 ether;
        _rbTable[3] = 1000 ether;
        _rbTable[4] = 10000 ether;
        _rbTable[5] = 50000 ether;
        _rbTable[6] = 150000 ether;

        _levelTable[0] = 0;
        _levelTable[1] = 6;                // 从 1 级升到 2 级时需要销毁多少个 1 级的 NFT, 下面以此类推
        _levelTable[2] = 5;
        _levelTable[3] = 4;
        _levelTable[4] = 3;
        _levelTable[5] = 2;
        _levelTable[6] = 0;

        //BNF-01, SFR-01
        emit Initialize(baseURI, initialRobiBoost, burnRBPeriod);
    }

    //External functions --------------------------------------------------------------------------------------------

    /**
     * @dev 获取这个 TokenId 的等级
     **/
    function getLevel(uint tokenId) external view returns(uint){
        return _tokens[tokenId].level;
    }

    /**
     * @dev 获取这个 TokenId 的能量
     **/
    function getRB(uint tokenId) external view returns(uint){
        return _tokens[tokenId].robiBoost;
    }

    /**
     * @dev 获取这个 TokenID 的详细信息
     **/
    function getInfoForStaking(uint tokenId) external view returns(
        address tokenOwner,
        bool stakeFreeze,
        uint robiBoost
    ){
        tokenOwner = ownerOf(tokenId);              // TokenID 的持有者
        robiBoost = _tokens[tokenId].robiBoost;     // TokenID 能量值
        stakeFreeze = _tokens[tokenId].stakeFreeze; // TOkenID 冻结参数
    }

    /**
     ＊@dev 设置每一级最大的能量值
     **/
    function setRBTable(uint[7] calldata rbTable) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _rbTable = rbTable;
    }

    /**
     * @dev 设置每升一级销毁的nft
     **/
    function setLevelTable(uint[7] calldata levelTable) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _levelTable = levelTable;
    }

    /**
     * @dev 设置每升级增幅能量值的百分比
     **/
    function setLevelUpPercent(uint8 percent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(percent > 0, "Wrong percent value");
        _levelUpPercent = percent;
    }

    /**
     * @dev 设置 URI
     **/
    function setBaseURI(string calldata newBaseUri) external onlyRole(DEFAULT_ADMIN_ROLE){
        _internalBaseURI = newBaseUri;
    }

    /**
     * @dev 设置记录能量值的有效天数
     **/
    function setBurnRBPeriod(uint newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE){
        require(newPeriod > 0, "Wrong period");
        _burnRBPeriod = newPeriod;
    }

    /**
     * @dev 冻结 nft 
     *
     * nft 一旦被冻结就无法执行转账与授权的操作，但这个函数需要持有冻结权限才能调用 
     **/
    function tokenFreeze(uint tokenId) external onlyRole(TOKEN_FREEZER) {
        // 冻结令牌时清除所有审批
        _approve(address(0), tokenId);
        // 冻结
        _tokens[tokenId].stakeFreeze = true;
    }

    /**
     * @dev 解冻 nft
     **/
    function tokenUnfreeze(uint tokenId) external onlyRole(TOKEN_FREEZER) {
        _tokens[tokenId].stakeFreeze = false;
    }

    /**
     * @dev 记录能量值
     *
     * 为一个用户记录能量值，用户就可以把能量值充值给他的 nft 的属性上，但这个函数需要
     * 持有记录能量值权限才能调用 
     **/
    function accrueRB(address user, uint amount) external onlyRole(RB_SETTER_ROLE) {
        // 获取天数
        uint curDay = block.timestamp/86400;
        // 设置 user 地址这 curDay 天，能量值
        increaseRobiBoost(user, curDay, amount);
        emit RBAccrued(user, _robiBoost[user][curDay]);
    }

    //Public functions --------------------------------------------------------------------------------------------

    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721EnumerableUpgradeable, AccessControlUpgradeable)
    returns(bool)
    {
        return interfaceId == type(IERC721EnumerableUpgradeable).interfaceId ||
    super.supportsInterface(interfaceId);
    }

    /**
     * @dev 获取 nft token id 还剩余多少能量值达到当前等级的上限
     * 
     * 这是接受一个数组的 nft token id，返回所有
     **/
    function remainRBToNextLevel(uint[] calldata tokenId) public view returns(uint[] memory) {
        // 发送的 tokenId 不能大于 30 个
        require(tokenId.length <= MAX_ARRAY_LENGTH_PER_REQUEST, "Array length gt max");
        // 一样长度的数组
        uint[] memory remainRB = new uint[](tokenId.length);
        for(uint i = 0; i < tokenId.length; i++){
            // 必须是有效的 tokenId
            require(_exists(tokenId[i]), "ERC721: token does not exist");
            // 记录每一个 tokenId 还是剩下多少能量值能达到当前等级的能量值上限
            remainRB[i] = _remainRBToMaxLevel(tokenId[i]);
        }
        return remainRB;
    }

    /**
     * @dev 获取用户在有效的 10 天内产出的能量值总和
     * 
     **/
    function getRbBalance(address user) public view returns(uint){
        return _getRbBalance(user);
    }



    /**
     * user            ：用户地址
     * dayCount        ：多少天，从今天开始往后倒退 dayCount 天，把用户产出的能量值用数组返回
     **/
    function getRbBalanceByDays(address user, uint dayCount) public view returns(uint[] memory){
        uint[] memory balance = new uint[](dayCount);
        for(uint i = 0; i < dayCount; i++){
            balance[i] = _robiBoost[user][(block.timestamp - i * 1 days)/86400];
        }
        return balance;
    }

    /**
     * @dev 获取 period 天内产出的所有用户的能量值总和
     **/
    function getRbTotalAmount(uint period) public view returns(uint amount){
        for(uint i = 0; i <= period; i++){
            amount += _robiBoostTotalAmounts[(block.timestamp - i * 1 days)/86400];
        }
        return amount;
    }

    /**
     * @dev 获取 nft token id 信息结构
     **/ 
    function getToken(uint _tokenId) public view returns(
        uint tokenId,               // tokenID
        address tokenOwner,         // tokenId 的持有者
        uint level,                 // tokenId 的级别
        uint rb,                    // tokenId 的能量值
        bool stakeFreeze,           // tokenId 是否冻结
        uint createTimestamp,       // tokenId imit 的时间
        uint remainToNextLevel,     // tokenId 还是剩下多少能力值可到达当前 nft 等级的能量值上限
        string memory uri           // tokenId 的 url
    ){
        require(_exists(_tokenId), "ERC721: token does not exist");
        Token memory token = _tokens[_tokenId];
        tokenId = _tokenId;                                     
        tokenOwner = ownerOf(_tokenId);
        level = token.level;
        rb = token.robiBoost;
        stakeFreeze = token.stakeFreeze;
        createTimestamp = token.createTimestamp;
        remainToNextLevel = _remainRBToMaxLevel(_tokenId);
        uri = tokenURI(_tokenId);
    }

    /**
     * @dev 重写 approve，只有不被冻结的 nft 才能 opprove
     **/
    function approve(address to, uint256 tokenId) public override {
        if(_tokens[tokenId].stakeFreeze == true){
            revert("ERC721: Token frozen");
        }
        super.approve(to, tokenId);
    }

    //BNF-02, SCN-01, SFR-02
    /**
     * @dev 铸造一个 1 级的 nft
     **/
    function mint(address to) public onlyRole(TOKEN_MINTER_ROLE) nonReentrant {
        require(to != address(0), "Address can not be zero");
        _lastTokenId +=1;                                       // 增 1，作为 token id
        uint tokenId = _lastTokenId;                    
        _tokens[tokenId].robiBoost = _initialRobiBoost;         // 初始能量值
        _tokens[tokenId].createTimestamp = block.timestamp;     // 创建的时间
        _tokens[tokenId].level = 1; //start from 1 levelUp      // 等级
        _safeMint(to, tokenId);
    }

    //BNF-02, SCN-01, SFR-02
    /**
     * @dev 铸造任意等级的 nft
     **/
    function launchpadMint(address to, uint level, uint robiBoost) public onlyRole(LAUNCHPAD_TOKEN_MINTER) nonReentrant {
        require(to != address(0), "Address can not be zero");
        // 赋予给这个 nft 的能量值不能大于这个级别 nft 的能量值上限
        require(_rbTable[level] >= robiBoost, "RB Value out of limit");
        _lastTokenId +=1;
        uint tokenId = _lastTokenId;
        _tokens[tokenId].robiBoost = robiBoost;
        _tokens[tokenId].createTimestamp = block.timestamp;
        _tokens[tokenId].level = level;
        _safeMint(to, tokenId);
    }

    /**
     * @dev 升级
     **/
    function levelUp(uint[] calldata tokenId) public nonReentrant {
        // tokenId 不能超过 30 个
        require(tokenId.length <= MAX_ARRAY_LENGTH_PER_REQUEST, "Array length gt max");
        // 获取第一个 tokenId 的级别
        uint currentLevel = _tokens[tokenId[0]].level;
        // 这个级别的 token 销毁数量不能等于 0
        require(_levelTable[currentLevel] !=0, "This level not upgradable");
        // 获取这个等级的销毁的数量
        uint numbersOfToken = _levelTable[currentLevel];
        // 销毁的数量必须与发送的 tokenId 的数量相等
        require(numbersOfToken == tokenId.length, "Wrong numbers of tokens received");
        // 当前等级的最大能量值 * 销毁 tokenId 数量 = 下一级的能量值
        uint neededRb = numbersOfToken * _rbTable[currentLevel];

        // 获取 tokenId [] 所有的能量值累加
        uint cumulatedRb = 0;
        for(uint i = 0; i < numbersOfToken; i++){
            // 获取 tokenId 信息
            Token memory token = _tokens[tokenId[i]]; //safe gas
            // 数组的 tokenId 的等级必须都是相等的
            require(token.level == currentLevel, "Token not from this level");
            // 把每个 tokenId 的能量值累加
            cumulatedRb += token.robiBoost;
        }
        // 用户想要升级，必须每一个 nft 都达到最大的能量值才能升级
        if(neededRb == cumulatedRb){
            _mintLevelUp((currentLevel + 1), tokenId);
        } else{
            revert("Wrong robi boost amount");
        }
        emit LevelUp(msg.sender, (currentLevel + 1), tokenId);
    }

    /**
     * @dev 为 nft token id 充值能量值
     *
     * @param tokenid   充值的 nft token id 的集合 
     * @param amount    为 nft token id 充值能量的数值，俩个参数下标一一对应
     *
     * 注意：tokenId 要充值的能量值总和大于产出的能量值就会失败
     **/
    function sendRBToToken(uint[] calldata tokenId, uint[] calldata amount) public nonReentrant {
        _sendRBToToken(tokenId, amount);
    }

    /**
     * @dev 为 nft token id 充值能量值
     *
     * 这个函数的使用方式是，如果用户发送的 nft token id 的集合累加起来的能量值大于，当前用户
     * 所产出的能量值，就会充值失败，就会损失 gas 费用
     *
     * 如果小于，则用户发送的 nft token id 的集合全部充满到当前级别的能量值上限
     *    
     **/
    function sendRBToMaxInTokenLevel(uint[] calldata tokenId) public nonReentrant {
        // 发送的 tokenId 不能大于 30 个
        require(tokenId.length <= MAX_ARRAY_LENGTH_PER_REQUEST, "Array length gt max");
        // 记录发送过来的所有 tokenId 剩下能量值总和
        uint neededAmount;
        // 一样长度的数组
        uint[] memory amounts = new uint[](tokenId.length);
        for(uint i = 0; i < tokenId.length; i++){
            // 获取这个 tokenId 还剩下多少能量值，才能达到上限
            uint amount = _remainRBToMaxLevel(tokenId[i]);
            // tokenId 下标对应 tokenId 还剩下多少能量值，才能达到上限
            amounts[i] = amount;  
            // 总和累加  
            neededAmount += amount;
        }
        // 获取发送者的这几天内产出的能量值总和
        uint availableAmount = _getRbBalance(msg.sender);
        // 如果产出的能量总和不能大于 所有 tokenId 剩下能量值总和，那就没有必要执行下去，因为执行下去也是会失败的
        if(availableAmount >= neededAmount){
            // 为每个 nft token id 充满能量值
            _sendRBToToken(tokenId, amounts); 
        } else{
            revert("insufficient funds");
        }
    }

    //Internal functions --------------------------------------------------------------------------------------------

    function _baseURI() internal view override returns (string memory) {
        return _internalBaseURI;
    }

    function _safeMint(address to, uint256 tokenId) internal override {
        super._safeMint(to, tokenId);
        emit TokenMint(to, tokenId, _tokens[tokenId].level, _tokens[tokenId].robiBoost);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721EnumerableUpgradeable) {
        if(_tokens[tokenId].stakeFreeze == true){
            revert("ERC721: Token frozen");
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev 获取用户的有效天数内的能量值总和
     **/
    function _getRbBalance(address user) internal view returns(uint balance){
        for(uint i = 0; i <= _burnRBPeriod; i++){
            balance += _robiBoost[user][(block.timestamp - i * 1 days)/86400];
        }
        return balance;
    }

    /**
     * @dev 获取这个 nft token id 还剩下多少能力值才达到这个等级的上限
     **/
    function _remainRBToMaxLevel(uint tokenId) internal view returns(uint) {
        return _rbTable[uint(_tokens[tokenId].level)] - _tokens[tokenId].robiBoost;
    }


    /**
     * @dev 为 nft tokenid 充值能量值
     *
     * 用户收割这 _burnRBPeriod 天内产出的能量值，赋给了 nft 的能量值增加
     * tokenId[0] 用户为这个 nft 增加能量值
     * amount[0]  这个数组记录为每一个 tokenId 充值能量值的额度。注意，产出能量值必须大于充值的能量值不然就会失败
     *
     * 第一个 tokenId 充值完后就会充值给下一个。但是一旦有一个 amount 充不满这个数值，所有交易就会失败
     **/
    function _sendRBToToken(uint[] memory tokenId, uint[] memory amount) internal {
        // 用户要充值的 nft token id 的集合不能大于 30
        require(tokenId.length <= MAX_ARRAY_LENGTH_PER_REQUEST, "Array length gt max");
        // 俩个数组的长度必须是相等的
        require(tokenId.length == amount.length, "Wrong length of arrays");


        for(uint i = 0; i < tokenId.length; i++){
            // 令牌的拥有者必须是消息发送者
            require(ownerOf(tokenId[i]) == msg.sender, "Not owner of token");
            // 获取 tokenid[i] 位置 nft token id 要充值的能量值数值
            uint calcAmount = amount[i];
            // 产出能量值的有效天数，节省 gas
            uint period = _burnRBPeriod;
            uint currentRB;
            uint curDay;
            while(calcAmount > 0 || period > 0){
                // 获取往后第 period 添加
                curDay = (block.timestamp - period * 1 days)/86400;
                // 获取这一天用户产出的能量值
                currentRB = _robiBoost[msg.sender][curDay];
                // 如果这一天用户没有记录的能力值，那就不用执行后面了
                if(currentRB == 0) {
                    period--;
                    continue;
                }
                // 如果用户为当前 nft token id 充值的能量值大于这一天产出的能力值，就表示还需要循环下一天的产出能量值
                // 直到为这个 nft token id 要充值的能量值小于产出的能量值
                // 当小于的时候，就表示可以为这个 nft token id 充值能量了
                if(calcAmount > currentRB){
                    // 用户充值的能量值减去这 period 天的产出能量值，等于这个 nft token id 还需要充值的能量值
                    calcAmount -= currentRB;
                    // 这个参数时记录这一天的所有用户的能量值要 - currentRB
                    _robiBoostTotalAmounts[curDay] -= currentRB;
                    // 清除用户这 period 天的能量值时记录
                    delete _robiBoost[msg.sender][curDay];

                } else {
                    // 当执行到这里，就表示 [i] 位置的 nft 能量值已经达到上限，把这天产出的能量值 - calcAmount 即可，因为这一天产出的能量值不会消耗完
                    decreaseRobiBoost(msg.sender, curDay, calcAmount);
                    calcAmount = 0;
                    break;
                }
                period--;       // 用户循环之几天的能量值
            }
            // 如果等于 0， 就表示用户全部收割这几天产出的能量值
            // 如果大于 0， 就表示用户想收割的数量大于这几天产出的能量值，所以就抛出错误
            if(calcAmount == 0){
                // 为这个 tokenId 增加 amount[i] 数量的能量值，这个不会溢出，数值是刚刚好的
                _gainRB(tokenId[i], amount[i]);
            } else{
                revert("Not enough RB balance");
            }
        }
    }

    //Private functions --------------------------------------------------------------------------------------------

    /**
     * @dev nft 升级
     * 
     * @param level nft token id 的等级
     * @param tokenid 需要销毁的 nft token id 
     **/
    function _mintLevelUp(uint level, uint[] memory tokenId) private {
        uint newRobiBoost = 0;
        for(uint i = 0; i <tokenId.length; i++){
            require(ownerOf(tokenId[i]) == msg.sender, "Not owner of token");
            // nft token id 能量值累加
            newRobiBoost += _tokens[tokenId[i]].robiBoost;
            // 销毁这个 token
            _burn(tokenId[i]);
        }
        // 在原基础增幅 10% 的能量值
        newRobiBoost = newRobiBoost + newRobiBoost * _levelUpPercent / 100;
        _lastTokenId +=1;
        uint newTokenId = _lastTokenId;
        _tokens[newTokenId].robiBoost = newRobiBoost;
        _tokens[newTokenId].createTimestamp = block.timestamp;
        _tokens[newTokenId].level = level;
        _safeMint(msg.sender, newTokenId);
    }

    /**
     * @dev 记录用户每一天的能量值
     **/
    function increaseRobiBoost(address user, uint day, uint amount) private {
        // 记录用户每一天的能量值
        _robiBoost[user][day] += amount;
        // 这一天累加能量
        _robiBoostTotalAmounts[day] += amount;
    }

    /**
     * @dev 减去记录这一天的能量值
     * 
     * @param user 要减去的 user 的记录的能量值的地址
     * @param day 表示这一天
     * @param amount 减去 amount 数值的能量值
     **/
    function decreaseRobiBoost(address user, uint day, uint amount) private {
        // 用户这 day 天的能量必须是大于收割的 amount 能量值
        // 这 day 天记录所有用户的能力值的参数也必须大于 amount 能量值
        require(_robiBoost[user][day] >= amount && _robiBoostTotalAmounts[day] >= amount, "Wrong amount");
        _robiBoost[user][day] -= amount;
        _robiBoostTotalAmounts[day] -= amount;
    }

    /**
     * @dev 为 nft tokne id 充值能量
     **/
    function _gainRB(uint tokenId, uint rb) private {
        // tokenId 必须是有效的
        require(_exists(tokenId), "Token does not exist");
        // tokenId 必须是处于不被冻结的状态
        require(_tokens[tokenId].stakeFreeze == false, "Token is staked");
        Token storage token = _tokens[tokenId];
        // 相加
        uint newRP = token.robiBoost + rb;
        // 相加的能量值必须是小于这个级别的上限
        require(newRP <= _rbTable[token.level], "RB value over limit by level");
        token.robiBoost = newRP;    // 增加
        emit GainRB(tokenId, newRP);
    }
}