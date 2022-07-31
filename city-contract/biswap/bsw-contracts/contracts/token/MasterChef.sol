/**
 *Submitted for verification at BscScan.com on 2021-05-24
*/

pragma solidity 0.6.12;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./bsw.sol";


interface IMigratorChef {
    function migrate(IERC20 token) external returns (IERC20);
}

// MasterChef is the master of BSW. He can make BSW and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once BSW is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterChef is Ownable {
    using SafeMath for uint256;
    using SafeBEP20 for IERC20;
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of BSWs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accBSWPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accBSWPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }
    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken;           // 质押的 token 地址
        uint256 allocPoint;       // 这个池子的占比中矿池的分配点
        uint256 lastRewardBlock;  // 分配发生的最后一个块号
        uint256 accBSWPerShare;   // 用户每质押一个代币可获取 accBSWPerShare 收益
    }
    // 产出的 Token
    BSWToken public BSW;
    // 矿池的 100% 比例数值
    uint256 public percentDec = 1000000;
    // 质押者共同分享一个区块产出的 85.7% 代币
    uint256 public stakingPercent;          // 857000  占比 85.7%
    // 开发团队钱包来自代币的资金百分比      
    uint256 public devPercent;              // 90000   占比 9%
    // 委员会钱包来自代币的资金百分比
    uint256 public refPercent;              // 43000   占比 4.3%
    // 基金钱包来自代币的资金百分比
    uint256 public safuPercent;             // 10000   占比 1%
    // 开发团队的钱包地址
    address public devaddr;
    // 基金钱包地址
    address public safuaddr;
    // 委员会钱包地址
    address public refAddr;
    // Last block then develeper withdraw dev and ref fee
    uint256 public lastBlockDevWithdraw;
    // 一个区块产出多少个 BSW
    uint256 public BSWPerBlock;
    // 早期 BSW 制造商的奖金更高。
    uint256 public BONUS_MULTIPLIER = 1;
    // 迁移合约的地址
    IMigratorChef public migrator;
    // 池子的数据
    PoolInfo[] public poolInfo;
    // 池子 用户地址 用户质押信息
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // 总分配点。必须是所有池中所有分配点的总和
    uint256 public totalAllocPoint = 0;
    // 矿池开始挖矿的区块
    uint256 public startBlock;
    // MasterChef 中的 BSW 存款金额
    uint256 public depositedBsw;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );

    constructor(
        BSWToken _BSW,
        address _devaddr,
        address _refAddr,
        address _safuaddr,
        uint256 _BSWPerBlock,
        uint256 _startBlock,
        uint256 _stakingPercent,
        uint256 _devPercent,
        uint256 _refPercent,
        uint256 _safuPercent
    ) public {
        BSW = _BSW;                                 // 奖励的 Token
        devaddr = _devaddr;                         // 开发团队的钱包地址
        refAddr = _refAddr;                         // 委员会的钱包地址
        safuaddr = _safuaddr;                       // 基金的钱包地址
        BSWPerBlock = _BSWPerBlock;                 // 每一个区块产出多少 BSW
        startBlock = _startBlock;                   // 矿池启动的区块        
        stakingPercent = _stakingPercent;           // 质押者共同占比的百分比
        devPercent = _devPercent;                   // 开发团队占比的百分比
        refPercent = _refPercent;                   // 委员会占比的百分比
        safuPercent = _safuPercent;                 // 基金的占比的百分比
        lastBlockDevWithdraw = _startBlock;         // 团队最后提取奖励的区块
        
        
        // 创建 BSW 单币质押池子
        poolInfo.push(PoolInfo({
            lpToken: _BSW,
            allocPoint: 1000,
            lastRewardBlock: startBlock,
            accBSWPerShare: 0
        }));

        totalAllocPoint = 1000;                     // 千分之一的份额

    }

    /**
     * @dev 设置早期质押者的奖金乘数
     **/
    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        BONUS_MULTIPLIER = multiplierNumber;
    }

    /**
     * @dev 池子的数量
     **/
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @dev 提取其他钱包的奖励
     **/
    function withdrawDevAndRefFee() public{
        // 如果不小于，就表示同一个区块刚取出
        require(lastBlockDevWithdraw < block.number, 'wait for new block');
        // 获取可释放 BSW 的区块
        uint256 multiplier = getMultiplier(lastBlockDevWithdraw, block.number);
        // 总奖励
        uint256 BSWReward = multiplier.mul(BSWPerBlock);
        // 为开发团队、委员会、基金等钱包 mint BSW分配的份额
        BSW.mint(devaddr, BSWReward.mul(devPercent).div(percentDec));
        BSW.mint(safuaddr, BSWReward.mul(safuPercent).div(percentDec));
        BSW.mint(refAddr, BSWReward.mul(refPercent).div(percentDec));
        // 更新
        lastBlockDevWithdraw = block.number;
    }

    /**
     * @dev 创建一个池子
     *
     * 注意： 请勿多次添加同一LP令牌。如果你这样做的话，奖励将被打乱
     **/
    function add( uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate ) public onlyOwner {
        // 可以不更新池子
        if (_withUpdate) {
            massUpdatePools();
        }

        // 最后更新的区块不能小于当前区块
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        // 总分配点累计
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        // 创建池子
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accBSWPerShare: 0
            })
        );
    }

    /**
     * @dev 更新池子的分配
     **/
    function set( uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    /**
     * @dev 设置迁移合约地址
     **/
    function setMigrator(IMigratorChef _migrator) public onlyOwner {
        migrator = _migrator;
    }

    /**
     * @dev 迁移
     **/
    function migrate(uint256 _pid) public {
        require(address(migrator) != address(0), "migrate: no migrator");
        PoolInfo storage pool = poolInfo[_pid];
        IERC20 lpToken = pool.lpToken;
        uint256 bal = lpToken.balanceOf(address(this));
        lpToken.safeApprove(address(migrator), bal);
        IERC20 newLpToken = migrator.migrate(lpToken);
        require(bal == newLpToken.balanceOf(address(this)), "migrate: bad");
        pool.lpToken = newLpToken;
    }

    
    /**
     * @dev 获取有效的区块
     **/
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
         return _to.sub(_from).mul(BONUS_MULTIPLIER);
    }

    /**
     * @dev 用户未提取的收益
     **/
    function pendingBSW(uint256 _pid, address _user) external view returns (uint256){

        // 获取 _pid 池子
        PoolInfo storage pool = poolInfo[_pid];
        // 获取用户在这个池子质押 LP 的信息
        UserInfo storage user = userInfo[_pid][_user];
        // 获取上次更新的每一股能配分多少 BSW
        uint256 accBSWPerShare = pool.accBSWPerShare;
        // 获取总质押的 LP 数量
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        // 这个是因为池子更新就会把产出的 BSW imit 到当前合约，产出与质押的 BSW 混在一起就会产出数据不对，所有就使用 depositedBsw 字段来记录用户质押 BSW 的数量
        if (_pid == 0){
            // 质押的 BSW 总量
            lpSupply = depositedBsw;
        }

        // 当前区块必须大于池子最后更新的区块，不大于就使用 accBSWPerShare 参数即可
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            // 获取有效的产出 BSW 区块数量
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            // 有效区块数 * 每个区块产出的数量 * 池子占比的分配点 / 矿池的总分配点 == 池子在这个区块有效内享有 BSW 占比
            // 池子在这个区块有效内享有 BSW 占比 * 质押者共同占比的百分比 / 总100% ==  有效的池子在这个区块有效内享有 BSW 占比
            uint256 BSWReward = multiplier.mul(BSWPerBlock).mul(pool.allocPoint).div(totalAllocPoint).mul(stakingPercent).div(percentDec);
            // 等于每一股质押可获取多少 BSW
            accBSWPerShare = accBSWPerShare.add(BSWReward.mul(1e12).div(lpSupply));
        }

        // 用户质押的 n 股 * accBSWPerShare - 已经提取数量 == 用户可以提取的数量
        return user.amount.mul(accBSWPerShare).div(1e12).sub(user.rewardDebt);
    }

    /**
     * @dev 更新所有池的奖励值。小心汽油消费！
     **/
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /**
     * @dev 更新池子
     **/
    function updatePool(uint256 _pid) public {

        // 获取当前的池子
        PoolInfo storage pool = poolInfo[_pid];
        // 一个区块内更新一次即可
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (_pid == 0){
            lpSupply = depositedBsw;
        }
        // 如果没有质押，更新 lastRewardBlock 值即可
        if (lpSupply <= 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        // 获取有效的区块数量
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        // 获取在有效区块质押者共同占比的奖励数量， 
        uint256 BSWReward = multiplier.mul(BSWPerBlock).mul(pool.allocPoint).div(totalAllocPoint).mul(stakingPercent).div(percentDec);
        // 直接 mint 给当前合约
        BSW.mint(address(this), BSWReward);
        // 更新每质押一股就可以收获多少 BSW
        pool.accBSWPerShare = pool.accBSWPerShare.add(BSWReward.mul(1e12).div(lpSupply));
        // 更新 lastRewardBlock
        pool.lastRewardBlock = block.number;
    }

    /**
     * @dev 用户往 pid 池子质押代币
     **/
    function deposit(uint256 _pid, uint256 _amount) public {

        require (_pid != 0, 'deposit BSW by staking');

        // 获取要质押的池子
        PoolInfo storage pool = poolInfo[_pid];
        // 获取在这个池子的用户信息
        UserInfo storage user = userInfo[_pid][msg.sender];
        // 把当前池子更新到最新状态
        updatePool(_pid);
        // 如果以前用户质押的数量大于 0，就给用户发送上次质押的奖励
        if (user.amount > 0) {
            // 获取用户可提取奖励的 BSW
            uint256 pending = user.amount.mul(pool.accBSWPerShare).div(1e12).sub(user.rewardDebt);
            // 转给用户
            safeBSWTransfer(msg.sender, pending);
        }
        // 把用户质押的代币转到合约地址
        pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
        // 用户质押的数量累加
        user.amount = user.amount.add(_amount);
        // 累加后的质押 * accBSWPerShare == 这样用户的奖励清零了
        user.rewardDebt = user.amount.mul(pool.accBSWPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev 取出质押的代币
     **/
    function withdraw(uint256 _pid, uint256 _amount) public {

        require (_pid != 0, 'withdraw BSW by unstaking');

        // 获取信息
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        // 用户取出质押的 LP 不能大于质押的数量
        require(user.amount >= _amount, "withdraw: not good");
        // 更新池子
        updatePool(_pid);
        // 获取这个用户可以提取的奖励
        uint256 pending = user.amount.mul(pool.accBSWPerShare).div(1e12).sub(user.rewardDebt);
        // 把奖励转给用户
        safeBSWTransfer(msg.sender, pending);
        // 减少用户的质押
        user.amount = user.amount.sub(_amount);
        // 把用户的奖励清零
        user.rewardDebt = user.amount.mul(pool.accBSWPerShare).div(1e12);
        // 把用户取出质押的数量转给用户
        pool.lpToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev 质押 BSW
     **/
    function enterStaking(uint256 _amount) public {
        
        // 获取 BSW 的信息
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        // 更新 BSW 的池子
        updatePool(0);
        // 如果以前用户质押的数量大于0，就給转给用户奖励的 BSW
        if (user.amount > 0) {
            // 获取可以奖励的数量
            uint256 pending = user.amount.mul(pool.accBSWPerShare).div(1e12).sub(user.rewardDebt);
            // 转入
            if(pending > 0) {
                safeBSWTransfer(msg.sender, pending);
            }
        }
        // 质押的数量必须大于 0
        if(_amount > 0) {
            // 转给合约地址
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
            depositedBsw = depositedBsw.add(_amount);
        }
        // 把用户清零到现在这个位置
        user.rewardDebt = user.amount.mul(pool.accBSWPerShare).div(1e12);
        emit Deposit(msg.sender, 0, _amount);
    }

    /**
     * @dev 取出质押的 BSW
     *
     * 他这个函数同时用于收割的功能，如果 amount 参数是 0 的话，就是单纯的收割
     **/
    function leaveStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(0);
        uint256 pending = user.amount.mul(pool.accBSWPerShare).div(1e12).sub(user.rewardDebt);
        if(pending > 0) {
            safeBSWTransfer(msg.sender, pending);
        }
        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
            depositedBsw = depositedBsw.sub(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accBSWPerShare).div(1e12);
        emit Withdraw(msg.sender, 0, _amount);
    }

    /**
     * @dev 取出质押代币
     * 
     * 紧急情况，取出 pid 池子质押的代币而不关心奖励
     **/
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    /**
     * @dev 取出合约持有 BSW
     **/
    function safeBSWTransfer(address _to, uint256 _amount) internal {
        uint256 BSWBal = BSW.balanceOf(address(this));
        if (_amount > BSWBal) {
            BSW.transfer(_to, BSWBal);
        } else {
            BSW.transfer(_to, _amount);
        }
    }

    
    function setDevAddress(address _devaddr) public onlyOwner {
        devaddr = _devaddr;
    }
    function setRefAddress(address _refaddr) public onlyOwner {
        refAddr = _refaddr;
    }
    function setSafuAddress(address _safuaddr) public onlyOwner{
        safuaddr = _safuaddr;
    }
    function updateBswPerBlock(uint256 newAmount) public onlyOwner {
        require(newAmount <= 30 * 1e18, 'Max per block 30 BSW');
        require(newAmount >= 1 * 1e18, 'Min per block 1 BSW');
        BSWPerBlock = newAmount;
    }
}