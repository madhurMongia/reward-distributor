// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title Referral Payout Distributor Interface.
/// @notice Interface for referral payout batches.
interface IReferralPayoutDistributor {
    /// @notice Distributes a referral payout batch.
    /// @param recipients The payout recipients.
    /// @param amounts The payout amounts.
    function distribute(address[] calldata recipients, uint256[] calldata amounts) external;

    /// @notice Withdraws reward tokens.
    /// @param amount The amount to withdraw.
    function withdraw(uint256 amount) external;

    /// @notice Changes the ERC20 token used for future payouts and withdrawals.
    /// @param newToken The new ERC20 token address.
    function setToken(address newToken) external;

    /// @notice Changes the operator.
    /// @param newOperator The new operator address.
    function setOperator(address newOperator) external;

}
