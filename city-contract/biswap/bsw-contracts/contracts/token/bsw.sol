/**
 *Submitted for verification at BscScan.com on 2021-05-24
*/

pragma solidity 0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract BEP20 is Context, IERC20, Ownable {
    uint256 private constant _preMineSupply = 10000000 * 1e18;
    uint256 private constant _maxSupply = 700000000 * 1e18; 

    using SafeMath for uint256;
    using Address for address;

    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a default value of 18.
     *
     * To select a different value for {decimals}, use {_setupDecimals}.
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name, string memory symbol) public {
        _name = name;
        _symbol = symbol;
        _decimals = 18;

        _mint(msg.sender, _preMineSupply);
    }

    /**
     * @dev Returns the bep token owner.
     */
    function getOwner() external override view returns (address) {
        return owner();
    }

    /**
     * @dev Returns the token name.
     */
    function name() public override view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the token decimals.
     */
    function decimals() public override view returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Returns the token symbol.
     */
    function symbol() public override view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev See {BEP20-totalSupply}.
     */
    function totalSupply() public override view returns (uint256) {
        return _totalSupply;
    }

    function preMineSupply() public override view returns (uint256) {
        return _preMineSupply;
    }

    function maxSupply() public override view returns (uint256) {
        return _maxSupply;
    }

    /**
     * @dev See {BEP20-balanceOf}.
     */
    function balanceOf(address account) public override view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {BEP20-transfer}.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    /**
     * @dev See {BEP20-allowance}.
     */
    function allowance(address owner, address spender) public override view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {BEP20-approve}.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    /**
     * @dev See {BEP20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {BEP20};
     *
     * Requirements:
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     * - the caller must have allowance for `sender`'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(
            sender,
            _msgSender(),
            _allowances[sender][_msgSender()].sub(amount, 'BEP20: transfer amount exceeds allowance')
        );
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {BEP20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].add(addedValue));
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {BEP20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        _approve(
            _msgSender(),
            spender,
            _allowances[_msgSender()][spender].sub(subtractedValue, 'BEP20: decreased allowance below zero')
        );
        return true;
    }

    /**
     * @dev Creates `amount` tokens and assigns them to `msg.sender`, increasing
     * the total supply.
     *
     * Requirements
     *
     * - `msg.sender` must be the token owner
     */
    function mint(uint256 amount) public onlyOwner returns (bool) {
        _mint(_msgSender(), amount);
        return true;
    }

    /**
     * @dev Moves tokens `amount` from `sender` to `recipient`.
     *
     * This is internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        require(sender != address(0), 'BEP20: transfer from the zero address');
        require(recipient != address(0), 'BEP20: transfer to the zero address');

        _balances[sender] = _balances[sender].sub(amount, 'BEP20: transfer amount exceeds balance');
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements
     *
     * - `to` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal returns(bool) {
        require(account != address(0), 'BEP20: mint to the zero address');
        if (amount.add(_totalSupply) > _maxSupply) {
            return false;
        }

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 amount) internal {
        require(account != address(0), 'BEP20: burn from the zero address');

        _balances[account] = _balances[account].sub(amount, 'BEP20: burn amount exceeds balance');
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner`s tokens.
     *
     * This is internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        require(owner != address(0), 'BEP20: approve from the zero address');
        require(spender != address(0), 'BEP20: approve to the zero address');

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`.`amount` is then deducted
     * from the caller's allowance.
     *
     * See {_burn} and {_approve}.
     */
    function _burnFrom(address account, uint256 amount) internal {
        _burn(account, amount);
        _approve(
            account,
            _msgSender(),
            _allowances[account][_msgSender()].sub(amount, 'BEP20: burn amount exceeds allowance')
        );
    }
}

/**
 * @dev DAO 治理合约
 *
 * 这样的治理合约继承了 ERC20 代币合约，就表示一枚代币代表着一票权，治理合约的内部逻辑不是通过转账的方式来投票
 * 而是通过记账来实现投票逻辑。
 *
 **/
contract BSWToken is BEP20('Biswap', 'BSW') {


    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet private _minters;

    /// @notice Creates `_amount` token to `_to`.
    function mint(address _to, uint256 _amount) public onlyMinter returns(bool) {
        _mint(_to, _amount);
        /**
         * 这里使用转移委托。
         * 因为是 mint 出来的代币，就表示投票的数量得到了新增，如果 to 地址有了委托人，那么就把 to 产出的票数记录
         * 到他的的委托人身上。
         *
         * 参数-A: 以前的委托人。这里设置零地址，是因为 mint 出来的票数注定没有久的委托人
         * 参数-B: 现在的委托人
         * 参数-C: 记录的票数
         **/
        _moveDelegates(address(0), _delegates[_to], _amount);
        return true;
    }

    // Copied and modified from YAM code:
    // https://github.com/yam-finance/yam-protocol/blob/master/contracts/token/YAMGovernanceStorage.sol
    // https://github.com/yam-finance/yam-protocol/blob/master/contracts/token/YAMGovernance.sol
    // Which is copied and modified from COMPOUND:
    // https://github.com/compound-finance/compound-protocol/blob/master/contracts/Governance/Comp.sol

    /**
     * @dev 记录每一个地址的委托人
     *
     * 在这个治理合约逻辑中, 只有委托人才能有投票的权利，而普通的用户虽热持有了代币，但是并没有投票的权利，用户只能把
     * 持有的票数给委托人来投票。
     *
     * 但是，用户可以把自己的地址设置成自己的委托人，这样用户就拥有了投票的权利
     **/
    mapping (address => address) internal _delegates;

    /**
     * @dev 检查点
     *
     * 用于标记委托地址在 fromBlock 区块持有多少可投票数
     **/
    struct Checkpoint {
        uint32 fromBlock;       // 区块
        uint256 votes;          // 票数
    }

    /**
     * @dev 记录委托地址《检查点》数据
     *
     * address     : 委托人地址
     * uint32      : 检查点数
     * Checkpoint  : 当前委托人的持有的票与最后委托的区快号
     **/
    mapping (address => mapping (uint32 => Checkpoint)) public checkpoints;

    /** 
     * @dev 记录委托地址最新的《检查点》下标
     **/
    mapping (address => uint32) public numCheckpoints;


    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

    /// @notice The EIP-712 typehash for the delegation struct used by the contract
    bytes32 public constant DELEGATION_TYPEHASH = keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

    /// @notice A record of states for signing / validating signatures
    mapping (address => uint) public nonces;

      /// @notice An event thats emitted when an account changes its delegate
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    /// @notice An event thats emitted when a delegate account's vote balance changes
    event DelegateVotesChanged(address indexed delegate, uint previousBalance, uint newBalance);

    /**
     * @dev 获取 delegator 地址的委托人
     */
    function delegates(address delegator)
        external
        view
        returns (address)
    {
        // 返回委托人的地址
        return _delegates[delegator];
    }

   /**
    * @dev 更换新的委托人
    *
    * @param delegatee  新的委托人地址
    */
    function delegate(address delegatee) external {
        // 将 msg.sender 的委托人账户更换为 delegatee 地址
        return _delegate(msg.sender, delegatee);
    }

    /**
     * @notice Delegates votes from signatory to `delegatee`
     * @param delegatee The address to delegate votes to
     * @param nonce The contract state required to match the signature
     * @param expiry The time at which to expire the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function delegateBySig(
        address delegatee,
        uint nonce,
        uint expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        external
    {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(name())),
                getChainId(),
                address(this)
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(
                DELEGATION_TYPEHASH,
                delegatee,
                nonce,
                expiry
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "/x19/x01",
                domainSeparator,
                structHash
            )
        );

        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "BSW::delegateBySig: invalid signature");
        require(nonce == nonces[signatory]++, "BSW::delegateBySig: invalid nonce");
        require(now <= expiry, "BSW::delegateBySig: signature expired");
        return _delegate(signatory, delegatee);
    }

    /**
     * @dev 获取委托地址持有的票数
     */
    function getCurrentVotes(address account)
        external
        view
        returns (uint256)
    {
        // 获取 account 地址检查点数
        uint32 nCheckpoints = numCheckpoints[account];
        // 如果检查点数大于 0， 表示 account 地址是一个委托人地址。返回这个 account 委托人持有的票数
        return nCheckpoints > 0 ? checkpoints[account][nCheckpoints - 1].votes : 0;
    }

    /**
     * @dev 获取 account 在 blockNumber 区块前持有的投票数
     *
     * 这个投票机制，只要在当前提案的区块前持有投票数，就算委托人在后面区快发生了票数更改，也不会影响对该提案的投票的数量变化。
     * 委托人持有的 10000 投票数在于提案前，就会对该提案拥有 10000 投票权。并不会因为后面区块投票数变更而影响
     * 
     * @param account 委托地址
     * @param blockNumber 区块数
     * @return The 可投票的数量
     */
    function getPriorVotes(address account, uint blockNumber)
        external
        view
        returns (uint256)
    {
        // blockNumber 参数一般都是提案开始的区快号
        // 如果大于当前区块，那就表示提案是不存在，所有就不必获取当前区块用户的可投票数量
        require(blockNumber < block.number, "BSW::getPriorVotes: not yet determined");

        // 如果检查点数等于 0， 就表示这个 account 地址并不是委托人，并没有拥有投票的权限
        uint32 nCheckpoints = numCheckpoints[account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // 如果委托人最后票数变更的区块，小于 blockNumber 区块，就直接返回持有的票数即可
        if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
            return checkpoints[account][nCheckpoints - 1].votes;
        }

        // 如果委托人在 0 检查点数的区块大于 blockNumber
        // 那么就表示当前委托人并不在 blockNumber 区块前持有投票数，并不能对该提案拥有投票权。返回 0 票数即可
        if (checkpoints[account][0].fromBlock > blockNumber) {
            return 0;
        }

        // 最后一种情况是 checkpoints[account][0].fromBlock < blockNumber && checkpoints[account][nCheckpoints - 1].fromBlock > blockNumber
        // 这是最后一种情况，就获取在 blockNumber 区块前 account 委托人持有的票数
        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.votes;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[account][lower].votes;
    }

    /**
     * @dev 更换新的委托人
     *
     * @param delegator  msg.sender 消息发送者
     * @param delegatee  新的委托人地址
     **/
    function _delegate(address delegator, address delegatee)
        internal
    {
        // 获取 msg.sender 以前的委托人
        address currentDelegate = _delegates[delegator];
        // 获取 msg.sender 持有的可投的票数
        uint256 delegatorBalance = balanceOf(delegator); 
        // 设置新的委托人
        _delegates[delegator] = delegatee;
        emit DelegateChanged(delegator, currentDelegate, delegatee);

        // 旧委托人
        // 新委托人
        // 委托的可投票的数额
        _moveDelegates(currentDelegate, delegatee, delegatorBalance);
    }

    /**
     * @dev 转移委托
     *
     * @param srcRep msg.sender 地址久的委托地址
     * @param dstRep msg.sender 地址新的委托地址
     * @param amount 转移的票数
     **/
    function _moveDelegates(address srcRep, address dstRep, uint256 amount) internal {

        //  以前的地址与新的地址必须是不能相等的。转移的票数必须是大于 0， 不然就没有意仪
        if (srcRep != dstRep && amount > 0) {

            // srcRep 如果等于 0 地址，就表示这些票并没有委托过给别人，就不需要更改 srcRep 状态
            if (srcRep != address(0)) {
                // 旧地址的检查点数
                uint32 srcRepNum = numCheckpoints[srcRep];
                // 如果等于 0，就说明用户以前虽然把 srcRep 设置成委托人，但是并没有票委托给他
                // 如果大于 0，就获取持有的票数
                uint256 srcRepOld = srcRepNum > 0 ? checkpoints[srcRep][srcRepNum - 1].votes : 0;
                // 减去相应的票等于新持有的票
                uint256 srcRepNew = srcRepOld.sub(amount);
                // 把新的票数写入检查点
                _writeCheckpoint(srcRep, srcRepNum, srcRepOld, srcRepNew);
            }
            // dstRep 如果不能等于 0 地址，因为票数不能销毁，否则就更新委托地址的检查点
            if (dstRep != address(0)) {
                // 目标地址检查点数
                uint32 dstRepNum = numCheckpoints[dstRep];
                // 如果等于 0，就表示还没有用户把票委托给 dstRep
                // 如果大于 0，就获取持有的票数。这些票都是别人用户委托给 dstRep 的
                uint256 dstRepOld = dstRepNum > 0 ? checkpoints[dstRep][dstRepNum - 1].votes : 0;
                // 旧票 + 新票 = dstRep 持有新的总票数
                uint256 dstRepNew = dstRepOld.add(amount);
                // 把新的票数写入检查点
                _writeCheckpoint(dstRep, dstRepNum, dstRepOld, dstRepNew);
            }
        }
    }

    /**
     * @dev 写入检查点
     *
     * @param delegatee 委托地址
     * @param nCheckpoints 当前检查点的下标
     * @param oldVotes  久的票数
     * @param newVotes  新的票数
     *
     **/
    function _writeCheckpoint(
        address delegatee,          // 委托人地址
        uint32 nCheckpoints,        // 检查点数
        uint256 oldVotes,           // 旧票的数量
        uint256 newVotes            // 新持有的票数量
    )
        internal
    {
        // 区块数不能大于 uint32 最大值。这个不知为什么限制
        uint32 blockNumber = safe32(block.number, "BSW::_writeCheckpoint: block number exceeds 32 bits");

        // 检查点数必须大于 0。
        // 如果 delegatee 地址最后被委托的区块 == 当前区快，就说明多个用户把票委托给 delegatee 发生在同一个区块
        // 直接更新票数即可
        if (nCheckpoints > 0 && checkpoints[delegatee][nCheckpoints - 1].fromBlock == blockNumber) {
            checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
        } else {
            // 否则检查点数指向一个的 Checkpoint 对象
            // Checkpoint 对象包含了当前区块与新的持有票数
            checkpoints[delegatee][nCheckpoints] = Checkpoint(blockNumber, newVotes);
            // 委托人地址的检查点数增 1
            // 为下一次委托做准备
            numCheckpoints[delegatee] = nCheckpoints + 1;
        }

        emit DelegateVotesChanged(delegatee, oldVotes, newVotes);
    }

    /**
     * @dev 获取 uint32 最大值
     **/
    function safe32(uint n, string memory errorMessage) internal pure returns (uint32) {
        require(n < 2**32, errorMessage);
        return uint32(n);
    }

    /**
     * @dev 获取部署区块链的 ID
     **/
    function getChainId() internal pure returns (uint) {
        uint256 chainId;
        assembly { chainId := chainid() }
        return chainId;
    }

    /**
     * @dev 添加一个 mint 权限
     **/
    function addMinter(address _addMinter) public onlyOwner returns (bool) {
        require(_addMinter != address(0), "BSW: _addMinter is the zero address");
        return EnumerableSet.add(_minters, _addMinter);
    }

    /**
     * @dev 删除一个 mint 权限
     **/
    function delMinter(address _delMinter) public onlyOwner returns (bool) {
        require(_delMinter != address(0), "BSW: _delMinter is the zero address");
        return EnumerableSet.remove(_minters, _delMinter);
    }

    /** 
     * @dev 返回 mint 权限数量
     **/
    function getMinterLength() public view returns (uint256) {
        return EnumerableSet.length(_minters);
    }

    /**
     * @dev 是否有了 mint 权限
     **/
    function isMinter(address account) public view returns (bool) {
        return EnumerableSet.contains(_minters, account);
    }

    /**
     * @dev 通过下标获取权限地址
     **/
    function getMinter(uint256 _index) public view onlyOwner returns (address){
        require(_index <= getMinterLength() - 1, "BSW: index out of bounds");
        return EnumerableSet.at(_minters, _index);
    }

    /**
     * 拦截器
     **/
    modifier onlyMinter() {
        require(isMinter(msg.sender), "caller is not the minter");
        _;
    }
}