// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./IERC20.sol";
import "./ICrossChainProofOfHumanity.sol";

/// @title Reward Distributor Interface.
/// @notice Interface for distributing rewards to humans.
interface IRewardDistributor {
    /// @notice Allows a verified human to claim their reward tokens.
    /// @dev Verifies the humanity ID through the Proof of Humanity contract and ensures no double claiming.
    function claim() external;

    /// @notice Withdraw rewards.
    /// @param amount The amount to withdraw.
    function withdraw(uint256 amount) external;
}