// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (access/AccessControlEnumerable.sol)

pragma solidity ^0.8.0;

import "./IAccessControlEnumerable.sol";
import "./AccessControl.sol";
import "../utils/structs/EnumerableSet.sol";

/**
 * @dev 角色权限增强
 *
 * =============================================函数集合：--------------------------------------------------------------
 * 
 * getRoleMember(bytes32 role, uint256 index)               ：通过 index 下标来获取 role 角色的 account, 应为 account 存放在一个数组中
 * getRoleMemberCount(bytes32 role)                         ：获取 role 角色已经授权了多少个 account
 *
 * =============================================函数集合：--------------------------------------------------------------
 */
abstract contract AccessControlEnumerable is IAccessControlEnumerable, AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(bytes32 => EnumerableSet.AddressSet) private _roleMembers;

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControlEnumerable).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev 读取账户
     *
     * 这个可以通过 index 下标，获取 role 角色授权的账户 
     */
    function getRoleMember(bytes32 role, uint256 index) public view virtual override returns (address) {
        return _roleMembers[role].at(index);
    }

    /**
     * @dev 账户数量
     * 
     * 获取 role 角色的 account 授权的总量
     */
    function getRoleMemberCount(bytes32 role) public view virtual override returns (uint256) {
        return _roleMembers[role].length();
    }

    /**
     * @dev 角色授权
     *
     * 重写了 _grantRole() 函数，添加了记录这个绝对授权给了多少给用户
     */
    function _grantRole(bytes32 role, address account) internal virtual override {
        super._grantRole(role, account);
        _roleMembers[role].add(account);
    }

    /**
     * @dev 角色移除
     *
     * 重写了 _revokeRole() 函数
     */
    function _revokeRole(bytes32 role, address account) internal virtual override {
        super._revokeRole(role, account);
        _roleMembers[role].remove(account);
    }
}
