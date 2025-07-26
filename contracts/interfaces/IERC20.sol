// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title ERC20 Token Interface.
/// @notice Interface for standard ERC20 token functions.
interface IERC20 {
    /// @notice Transfers tokens to a specified address.
    /// @param to The recipient address.
    /// @param amount The amount of tokens to transfer.
    /// @return bool Success status of the transfer.
    function transfer(address to, uint256 amount) external returns (bool);
}