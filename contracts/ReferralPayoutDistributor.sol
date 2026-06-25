/** @authors: [@madhurMongia]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 *  SPDX-License-Identifier: MIT
 */

pragma solidity ^0.8.25;

import "./interfaces/IERC20.sol";
import "./interfaces/IReferralPayoutDistributor.sol";

/**
 * @title ReferralPayoutDistributor
 * @notice A contract that distributes ERC20 referral payouts in batches.
 */
contract ReferralPayoutDistributor is IReferralPayoutDistributor {

    /// @notice TRUSTED The ERC20 token being distributed as referral reward.
    IERC20 public token;

    /// @notice TRUSTED The owner that can update controls and withdraw tokens.
    address public owner;

    /// @notice TRUSTED The operator that can distribute referral payouts.
    address public operator;

    /// @notice Emitted when a referral payout batch is paid.
    /// @param recipients The payout recipients.
    /// @param amounts The payout amounts.
    event Paid(address[] recipients, uint256[] amounts);

    /// @notice Emitted when the owner withdraws tokens from the contract.
    /// @param to The address that received the withdrawn tokens.
    /// @param amount The amount of tokens withdrawn.
    event Withdrawn(address indexed to, uint256 amount);

    /// @notice Emitted when ownership of the contract is transferred.
    /// @param oldOwner The previous owner's address.
    /// @param newOwner The new owner's address.
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    /// @notice Emitted when the owner changes the payout token.
    /// @param oldToken The previous payout token.
    /// @param newToken The new payout token.
    event TokenChanged(address indexed oldToken, address indexed newToken);

    /// @notice Emitted when the owner changes the operator.
    /// @param oldOperator The previous operator.
    /// @param newOperator The new operator.
    event OperatorChanged(address indexed oldOperator, address indexed newOperator);

    /**
     * @notice Initializes the ReferralPayoutDistributor contract.
     * @param _token The address of the ERC20 token to distribute.
     * @param _operator The address allowed to distribute referral payouts.
     */
    constructor(address _token, address _operator) {
        require(_token != address(0), "invalid token");
        require(_operator != address(0), "invalid operator");
        token = IERC20(_token);
        owner = msg.sender;
        operator = _operator;
    }

    /**
     * @notice Modifier to restrict access to owner-only functions.
     * @dev Reverts if the caller is not the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    /**
     * @notice Modifier to restrict access to operator functions.
     * @dev Reverts if the caller is not the operator.
     */
    modifier onlyOperator() {
        require(msg.sender == operator, "not operator");
        _;
    }

    /**
     * @notice Transfers ownership of the contract to a new owner.
     * @param _newOwner The address of the new owner.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "invalid owner");
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }

    /**
     * @notice Changes the ERC20 token used for future payouts and withdrawals.
     * @param _newToken The new ERC20 token address.
     */
    function setToken(address _newToken) external onlyOwner {
        require(_newToken != address(0), "invalid token");
        address oldToken = address(token);
        token = IERC20(_newToken);
        emit TokenChanged(oldToken, _newToken);
    }

    /**
     * @notice Changes the operator.
     * @param _newOperator The new operator address.
     */
    function setOperator(address _newOperator) external onlyOwner {
        require(_newOperator != address(0), "invalid operator");
        address oldOperator = operator;
        operator = _newOperator;
        emit OperatorChanged(oldOperator, _newOperator);
    }

    /**
     * @notice Distributes a referral payout batch.
     * @param recipients The payout recipients.
     * @param amounts The payout amounts.
     */
    function distribute(address[] calldata recipients, uint256[] calldata amounts) external onlyOperator {
        require(recipients.length == amounts.length, "length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "invalid recipient");
            require(token.transfer(recipients[i], amounts[i]), "transfer failed");
        }

        emit Paid(recipients, amounts);
    }

    /**
     * @notice Allows the owner to withdraw tokens from the contract.
     * @param amount The amount of tokens to withdraw.
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(token.transfer(owner, amount), "transfer failed");
        emit Withdrawn(owner, amount);
    }
}
