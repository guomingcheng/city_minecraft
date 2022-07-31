/**
 *Submitted for verification at BscScan.com on 2021-07-08
*/

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IMasterChef {
    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function enterStaking(uint256 _amount) external;

    function leaveStaking(uint256 _amount) external;

    function pendingBSW(uint256 _pid, address _user) external view returns (uint256);

    function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256);

    function emergencyWithdraw(uint256 _pid) external;
}

/**
 * @dev 自动复投合约
 *
 **/
contract autoBsw is Ownable, Pausable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    struct UserInfo {
        uint256 shares;               // 用户持有的分配点，根据用户质押代币在池子总占比来计算的
        uint256 lastDepositedTime;    // 跟踪潜在罚款的缴存时间
        uint256 BswAtLastUserAction;  // 跟踪上次用户操作时存放的 BSW 代币
        uint256 lastUserActionTime;   // 记录用户最后操作的时间
    }   

    IERC20 public immutable token;    // 复投的 Token

    IMasterChef public immutable masterchef;        // 质押合约地址

    mapping(address => UserInfo) public userInfo;

    uint256 public totalShares;                     // 总分配点
    uint256 public lastHarvestedTime;               // 最新更新复投的时间
    address public admin;                           // 管理员地址
    address public treasury;                        // 财政部地址

    uint256 public constant MAX_PERFORMANCE_FEE = 500; // 5%
    uint256 public constant MAX_CALL_FEE = 100; // 1%
    uint256 public constant MAX_WITHDRAW_FEE = 100; // 1%
    uint256 public constant MAX_WITHDRAW_FEE_PERIOD = 3 days; // 3 days

    uint256 public performanceFee = 299; // 2.99%           // 财政部地址收益的比例
    uint256 public callFee = 25; // 0.25%                   // 复投触发者的收益比例
    uint256 public withdrawFee = 10; // 0.1%                // 惩罚在锁仓的时间内取消质押需要扣除手续费的比例
    uint256 public withdrawFeePeriod = 3 days; // 3 days    // 锁仓的时间

    event Deposit(address indexed sender, uint256 amount, uint256 shares, uint256 lastDepositedTime);
    event Withdraw(address indexed sender, uint256 amount, uint256 shares);
    event Harvest(address indexed sender, uint256 performanceFee, uint256 callFee);
    event Pause();
    event Unpause();

    /**
     * @notice Constructor
     * @param _token: 质押的 Token
     * @param _masterchef: 质押挖矿的合约地址
     * @param _admin: 管理员地址
     * @param _treasury: 财政部地址(collects fees)
     */
    constructor(
        IERC20 _token,
        IMasterChef _masterchef,
        address _admin,
        address _treasury
    ) public {
        token = _token;
        masterchef = _masterchef;
        admin = _admin;
        treasury = _treasury;

        // 授权最大值
        IERC20(_token).safeApprove(address(_masterchef), uint256(-1));
    }

    /**
     * @notice 管理人权限
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "admin: wut?");
        _;
    }

    /**
     * @notice 不能是合约
     */
    modifier notContract() {
        require(!_isContract(msg.sender), "contract not allowed");
        require(msg.sender == tx.origin, "proxy contract not allowed");
        _;
    }

    /**
     * 调用必须是合约地址
     * @notice Deposits funds into the Bsw Vault
     * @dev 质押代币
     * @param _amount: number of tokens to deposit (in Bsw)
     */
    function deposit(uint256 _amount) external whenNotPaused notContract {
        require(_amount > 0, "Nothing to deposit");

        // 获取合约持有的代币与质押在 MasterChef 的累加数量
        uint256 pool = balanceOf();
        // 把用户的质押的数量转移到合约地址
        token.safeTransferFrom(msg.sender, address(this), _amount);
        uint256 currentShares = 0;

        // 如果总分配点等于 0， 就表示用户是第一个质押者
        // 就不用计算质押的占比
        if (totalShares != 0) {
            currentShares = (_amount.mul(totalShares)).div(pool);
        } else {
            currentShares = _amount;
        }
        // 获取用户的信息
        UserInfo storage user = userInfo[msg.sender];
        // 用户分配点累加
        user.shares = user.shares.add(currentShares);
        // 更新锁仓时间
        user.lastDepositedTime = block.timestamp;

        // 总分配点累加
        totalShares = totalShares.add(currentShares);

        user.BswAtLastUserAction = user.shares.mul(balanceOf()).div(totalShares);
        user.lastUserActionTime = block.timestamp;

        // 把合约持有的 BSW 全部质押到矿池中
        _earn();

        emit Deposit(msg.sender, _amount, currentShares, block.timestamp);
    }

    /**
     * @dev 取消质押
     * @notice Withdraws all funds for a user
     */
    function withdrawAll() external notContract {
        withdraw(userInfo[msg.sender].shares);
    }

    /**
     * @dev 复投
     * @notice Reinvests Bsw tokens into MasterChef
     */
    function harvest() external notContract whenNotPaused {

        // 提取奖励
        IMasterChef(masterchef).leaveStaking(0);

        // 获取奖励的 BSW 数量
        uint256 bal = available();
        // 获取这次奖励的 2.99% 的比例数量
        uint256 currentPerformanceFee = bal.mul(performanceFee).div(10000);
        // 把这次奖励的 2.99% BSW 发送给财政部地址
        token.safeTransfer(treasury, currentPerformanceFee);

        // 获取这笔奖励的 0.25% 比例的 BSW 
        uint256 currentCallFee = bal.mul(callFee).div(10000);
        // 把他 0.25% 奖励发给消息发送者
        token.safeTransfer(msg.sender, currentCallFee);

        // 把剩余的 BSW 质押到池子中
        _earn();
        // 更新复投时间
        lastHarvestedTime = block.timestamp;

        emit Harvest(msg.sender, currentPerformanceFee, currentCallFee);
    }

    /**
     * @notice Sets admin address
     * @dev 修改管理员地址
     */
    function setAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Cannot be zero address");
        admin = _admin;
    }

    /**
     * @notice Sets treasury address
     * @dev 修改财政部地址
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Cannot be zero address");
        treasury = _treasury;
    }

    /**
     * @notice Sets performance fee
     * @dev 修改财政部地址收益的比例，不能大于 5%
     */
    function setPerformanceFee(uint256 _performanceFee) external onlyAdmin {
        require(_performanceFee <= MAX_PERFORMANCE_FEE, "performanceFee cannot be more than MAX_PERFORMANCE_FEE");
        performanceFee = _performanceFee;
    }

    /**
     * @notice Sets call fee
     * @dev 修改复投触发者的收益比例，不能大于 1%
     */
    function setCallFee(uint256 _callFee) external onlyAdmin {
        require(_callFee <= MAX_CALL_FEE, "callFee cannot be more than MAX_CALL_FEE");
        callFee = _callFee;
    }

    /**
     * @notice Sets withdraw fee
     * @dev 修改惩罚者的手续费，不能大于 1%
     */
    function setWithdrawFee(uint256 _withdrawFee) external onlyAdmin {
        require(_withdrawFee <= MAX_WITHDRAW_FEE, "withdrawFee cannot be more than MAX_WITHDRAW_FEE");
        withdrawFee = _withdrawFee;
    }

    /**
     * @notice Sets withdraw fee period
     * @dev 修改锁仓的时间，默认是 3 天。不能大于 3 天
     */
    function setWithdrawFeePeriod(uint256 _withdrawFeePeriod) external onlyAdmin {
        require(
            _withdrawFeePeriod <= MAX_WITHDRAW_FEE_PERIOD,
            "withdrawFeePeriod cannot be more than MAX_WITHDRAW_FEE_PERIOD"
        );
        withdrawFeePeriod = _withdrawFeePeriod;
    }

    /**
     * @notice Withdraws from MasterChef to Vault without caring about rewards.
     * @dev 紧急情况，全部取出质押在池子中的代币
     */
    function emergencyWithdraw() external onlyAdmin {
        IMasterChef(masterchef).emergencyWithdraw(0);
    }

    /**
     * @dev 提取 _token 令牌，这个令牌可能意外发送给这个合约，有了这个功能，在这个合约的代币就不会锁死
     * @notice Withdraw unexpected tokens sent to the Bsw Vault
     */
    function inCaseTokensGetStuck(address _token) external onlyAdmin {
        require(_token != address(token), "Token cannot be same as deposit token");

        uint256 amount = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(msg.sender, amount);
    }

    /**
     * @dev 合约暂停
     * @notice Triggers stopped state
     * @dev Only possible when contract not paused.
     */
    function pause() external onlyAdmin whenNotPaused {
        _pause();
        emit Pause();
    }

    /**
     * @dev 取消暂停
     * @notice Returns to normal state
     * @dev Only possible when contract is paused.
     */
    function unpause() external onlyAdmin whenPaused {
        _unpause();
        emit Unpause();
    }

    /**
     * @dev 获取复投触发者的手续费，当手续费到达一定的数量，套利者就有动力触发复投
     * @notice Calculates the expected harvest reward from third party
     * @return Expected reward to collect in Bsw
     */
    function calculateHarvestBswRewards() external view returns (uint256) {
        // 获取合约地址在矿池的奖励
        uint256 amount = IMasterChef(masterchef).pendingBSW(0, address(this));
        // 把矿池的奖励 + 合约持有的 == 可质押的数量
        amount = amount.add(available());
        // 计算复投触发者的手续费
        uint256 currentCallFee = amount.mul(callFee).div(10000);

        return currentCallFee;
    }

    /**
     * @dev 获取合约可质押到矿池的 BSW 数量
     * @notice Calculates the total pending rewards that can be restaked
     * @return Returns total pending Bsw rewards
     */
    function calculateTotalPendingBswRewards() external view returns (uint256) {
        // 获取奖励的数值
        uint256 amount = IMasterChef(masterchef).pendingBSW(0, address(this));
        // 合约持有的 BSW 等于可质押的代币
        amount = amount.add(available());

        return amount;
    }

    /**
     * @dev 获取每一个分配点，可换取多少 BSW
     * @notice Calculates the price per share
     */
    function getPricePerFullShare() external view returns (uint256) {
        return totalShares == 0 ? 1e18 : balanceOf().mul(1e18).div(totalShares);
    }

    /**
     * @dev 取消质押
     * @notice Withdraws from funds from the Bsw Vault
     * @param _shares: Number of shares to withdraw
     */
    function withdraw(uint256 _shares) public notContract {
        // 获取用户的信息
        UserInfo storage user = userInfo[msg.sender];
        // 取出的质押 BSW 必须大于 0
        require(_shares > 0, "Nothing to withdraw");
        // 取出质押的 BSW 必须是小于用户质押的数量
        require(_shares <= user.shares, "Withdraw amount exceeds balance");

        // 计算用户取走 BSW 的比例
        uint256 currentAmount = (balanceOf().mul(_shares)).div(totalShares);
        // 减少用户质押相应的份额
        user.shares = user.shares.sub(_shares);
        // 减少总量相应的份额
        totalShares = totalShares.sub(_shares);

        // 获取合约持有的 BSW 数量
        uint256 bal = available();
        // 如果合约持有的 BSW 数量少于用户要取出的 BSW 数量，就执行下一步的操作
        if (bal < currentAmount) {
            // 用户取出的 BSW 数量 - 合约持有的 BSW 数量 == 缺少相应的 BSW 数量
            uint256 balWithdraw = currentAmount.sub(bal);
            // 去矿池取出缺少那一部分的数量
            IMasterChef(masterchef).leaveStaking(balWithdraw);
            // 再次获取合约持有 BSW 的数量，这次的值的和包含是：bal balWithdraw 池子奖励的部分。这个值一定是大于 currentAmount
            uint256 balAfter = available();

            // 这一步，做得是校验，以防没有 BSW 共给用户提取
            uint256 diff = balAfter.sub(bal);
            // 如果 diff < balWithdrw， 就表示 BSW 不足提取
            if (diff < balWithdraw) {
                // 把剩余的的数量全部给用户
                currentAmount = bal.add(diff);  
            }
        }

        /**
         * 当用户质押代币在这个合约，在三天内就取出质押的代币就会收取 0.1% 手续费
         **/
        if (block.timestamp < user.lastDepositedTime.add(withdrawFeePeriod)) {
            // 获取罚款的数值，百分之 0.1%
            uint256 currentWithdrawFee = currentAmount.mul(withdrawFee).div(10000);
            // 转移到财政部地址
            token.safeTransfer(treasury, currentWithdrawFee);
            // 用户取出的数量更新
            currentAmount = currentAmount.sub(currentWithdrawFee);
        }


        if (user.shares > 0) {
            user.BswAtLastUserAction = user.shares.mul(balanceOf()).div(totalShares);
        } else {
            user.BswAtLastUserAction = 0;
        }

        // 记录用户最后操作的时间
        user.lastUserActionTime = block.timestamp;
        // 向用户转入取走的代币数量
        token.safeTransfer(msg.sender, currentAmount);

        emit Withdraw(msg.sender, currentAmount, _shares);
    }


    /**
     * @notice Custom logic for how much the vault allows to be borrowed
     * @dev 获取合约持有 BSW Token 的数量
     */
    function available() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice Calculates the total underlying tokens
     * @dev 包括合同持有的代币和MasterChef持有的代币
     */
    function balanceOf() public view returns (uint256) {
        // 获取合约往矿池质押 BSW 数量
        (uint256 amount, ) = IMasterChef(masterchef).userInfo(0, address(this));
        
        return token.balanceOf(address(this)).add(amount);
    }

    /**
     * @dev 把合约持有 BSW Token 全部质押在矿池中
     * @notice Deposits tokens into MasterChef to earn staking rewards
     */
    function _earn() internal {
        uint256 bal = available();
        if (bal > 0) {
            IMasterChef(masterchef).enterStaking(bal);
        }
    }

    /** 
     * @notice Checks if address is a contract
     * @dev 校验一个地址是否是合约地址 
     */
    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}