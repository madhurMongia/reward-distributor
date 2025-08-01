/** @authors: [@madhurMongia]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 *  SPDX-License-Identifier: MIT
 */

pragma solidity ^0.8.25;

import "./interfaces/IERC20.sol";
import "./interfaces/IRewardDistributor.sol";
import "./interfaces/ICrossChainProofOfHumanity.sol";

/**
 * @title RewardDistributor
 * @notice A contract that distributes ERC20 token rewards to verified humans.
 * @dev This contract allows verified humans (through Proof of Humanity) to claim a fixed amount of tokens once per humanity ID.
 */
contract RewardDistributor is IRewardDistributor {

    /// @notice TRUSTED The ERC20 token being distributed as rewards.
    IERC20 public immutable token;
    
    /// @notice The fixed amount of tokens each verified human can claim.
    uint256 public immutable amountPerClaim;
    
    /// @notice TRUSTED The owner of the contract who can withdraw tokens and transfer ownership.
    address public owner;
    
    /// @notice The Cross Chain Proof of Humanity contract used for verification.
    ICrossChainProofOfHumanity public immutable crossChainProofOfHumanity;
    
    /// @notice Mapping to track which humanity IDs have already claimed rewards.
    /// @dev Maps humanityID (bytes20) to claimed status (bool).
    mapping(bytes20 => bool) public claimed;

    /// @notice Emitted when a verified human claims their reward.
    /// @param humanityID The humanity ID of the verified human.
    event Claimed(bytes20 indexed humanityID);
    
    /// @notice Emitted when the owner withdraws tokens from the contract.
    /// @param to The address that received the withdrawn tokens.
    /// @param amount The amount of tokens withdrawn.
    event Withdrawn(address indexed to, uint256 amount);
    
    /// @notice Emitted when ownership of the contract is transferred.
    /// @param oldOwner The previous owner's address.
    /// @param newOwner The new owner's address.
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    /**
     * @notice Initializes the RewardDistributor contract.
     * @param _token The address of the ERC20 token to be distributed.
     * @param _amountPerClaim The fixed amount of tokens each verified human can claim.
     * @param _crossChainProofOfHumanity The address of the Cross Chain Proof of Humanity contract.
     */
    constructor(
        address _token,
        uint256 _amountPerClaim,
        ICrossChainProofOfHumanity _crossChainProofOfHumanity
    ) {
        token = IERC20(_token);
        amountPerClaim = _amountPerClaim;
        owner = msg.sender;
        crossChainProofOfHumanity = _crossChainProofOfHumanity;
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
     * @notice Transfers ownership of the contract to a new owner.
     * @dev Only the current owner can call this function.
     * @param _newOwner The address of the new owner.
     */
    function transferOwnership(address _newOwner) external onlyOwner() {
        owner = _newOwner;
        emit OwnershipTransferred(msg.sender, _newOwner);
    }

    /**
     * @notice Allows a verified human to claim their reward tokens.
     * @dev Verifies the humanity ID through the Proof of Humanity contract and ensures no double claiming.
     * - The humanity ID must be bound to a valid human account.
     * - The account must be verified as human in the Proof of Humanity Registry.
     * - The humanity ID must not have already claimed rewards.
     */
    function claim() external {
        // Check if the humanityID is valid.
        require(crossChainProofOfHumanity.isHuman(msg.sender), "not human");
        bytes20 humanityID = crossChainProofOfHumanity.humanityOf(msg.sender);
        // Check if the humanityID has already claimed the reward.
        require(!claimed[humanityID], "already claimed");

        // Set the claimed flag.
        claimed[humanityID] = true;

        // Transfer the tokens.
        require(token.transfer(msg.sender, amountPerClaim), "transfer failed");
        emit Claimed(humanityID);
    }
    
    /**
     * @notice Allows the owner to withdraw tokens from the contract.
     * @dev Only the owner can call this function.
     * Can be used to claim unclaimed tokens.
     * @param amount The amount of tokens to withdraw.
     */
    function withdraw(uint256 amount) external onlyOwner() {
        require(token.transfer(owner, amount), "transfer failed");
        emit Withdrawn(owner, amount);
    }
}