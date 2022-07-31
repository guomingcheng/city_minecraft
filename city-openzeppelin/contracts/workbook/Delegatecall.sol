pragma solidity 0.8.15;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract Storage {
    uint public val;
    constructor(uint v) {
        val = v;
    }
    function setValue(uint v) public {
        val = v;
    }
}

// 业务合约
contract Calculator{

  uint256 public s;
  uint256 public calculateResult;        // slot 0
  address public user;                   // slot 1 

  event Add(uint256 a, uint256 b);

  function add(uint256 a, uint256 b) public returns(uint256){
    calculateResult = calculateResult + b;
    assert(calculateResult >= a);
    emit Add(a , b);
    
    user = msg.sender;
    return calculateResult;
  }

}


// 代理合约
contract Machine{

  Storage public s;                       // slot 0
  uint256 public calculateResult;         // slot 1
  address public user;                    // slot 2

  event AddedValuesByDelegateCall(uint256 a, uint256 b, bool success);
  event AddedValuesByCall(uint256 a, uint256 b, bool success);

  constructor(Storage _s){
    s = _s;
    calculateResult = 0;
  }

  /**
   * 委托调用
   *
   * 当调用这个函数时， calculateResult 与 user 属性是得不到正确的修改，这是因为在 Calculator 业务合约中修改的状
   * 态变量卡槽位置与 Machine 位置不一致。
   *
   * 所以，在业务合约与代理合约中，定义变量的顺序位置要保持一致性，在 delegateCall 业务合约时，代理合约的状态才会得
   * 到正确的修改
   *
   * 在 Calculator 业务合约中，函数逻辑处理使用的状态变量都是来自于代理合约的状态变量保持的值。根据声明变量卡槽的位
   * 置与代理合约中一一对应
   *
   **/
  function addVvalueWithDelegateCall(address calculator, uint256 a, uint256 b) public returns(uint256){

    (bool success, bytes memory result) = calculator.delegatecall(abi.encodeWithSignature('add(uint256,uint256)', a , b));
    emit AddedValuesByDelegateCall(a, b, success);
    return abi.decode(result, (uint256));
  }

  /**
   * 正常调用
   *
   * 当调用这个函数时，修改的是业务合约得存储状态，不会影响代理合约得状态变量
   **/
  function addValuesWithCall(address calculator, uint256 a, uint256 b) public returns(uint256){

    (bool success, bytes memory result) = calculator.call(abi.encodeWithSignature('add(uint256,uint256)', a , b));
    emit AddedValuesByCall(a, b, success);
    return abi.decode(result, (uint256));
  }


}