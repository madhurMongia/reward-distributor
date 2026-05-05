/** @authors: [@madhurMongia]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 *  SPDX-License-Identifier: MIT
 */

pragma solidity ^0.8.25;

import "./interfaces/IERC20.sol";
import "./interfaces/IRewardDistributorV2.sol";
import "./interfaces/ICrossChainProofOfHumanity.sol";

/** @title RewardDistributorV2
 *  @notice Distributes PNK referral rewards against backend signed EIP-712 vouchers.
 *  @dev The backend signs a `ReferralReward` voucher for one side of a referral. Anyone can submit the
 *  voucher on-chain, the contract resolves the current owner of the selected humanity ID through
 *  cross chain Proof of Humanity before paying the reward.
 *  @dev The signed voucher commits to the reward token address, so vouchers signed for an old token become
 *  invalid after `setToken`. The voucher intentionally uses the currently configured Cross-Chain Proof of
 *  Humanity contract at claim time.
 */
contract RewardDistributorV2 is IRewardDistributorV2 {
    /// ====== ENUMS ====== ///

    /// @notice The referral side being paid.
    enum Role {
        REFEREE,
        REFERRER
    }

    /// ====== CONSTANTS ====== ///

    /// @dev The EIP-712 domainSeparator specific to this deployed instance. It is used to verify the ReferralReward's signature.
    bytes32 private immutable DOMAIN_SEPARATOR;

    /// @dev keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)").
    bytes32 private constant DOMAIN_TYPEHASH =
        0x8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a866;

    /// @dev The EIP-712 type hash for ReferralReward vouchers.
    bytes32 private immutable REFERRAL_REWARD_TYPEHASH;

    /// @dev Highest valid `s` value for secp256k1 signatures. Rejects the upper half order to prevent malleability.
    uint256 private constant MAX_VALID_S = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    /// ====== STORAGE ====== ///

    /// @notice TRUSTED The ERC20 token being distributed as reward.
    IERC20 public token;

    /// @notice The Cross Chain Proof of Humanity contract used for humanity ownership checks.
    ICrossChainProofOfHumanity public crossChainProofOfHumanity;

    /// @notice TRUSTED The owner of the contract who can update controls and withdraw tokens.
    address public owner;

    /// @notice TRUSTED Backend signer that authorizes referral reward vouchers.
    address public voucherSigner;

    /// @notice Maximum token amount a voucher can authorize.
    uint256 public maxAmount;

    /// @notice Tracks whether a referral side was already claimed.
    /// @dev Maps referee humanity ID => reward role => claimed status.
    /// A referred humanity ID can only generate one reward per role, even across renewals or reclaims.
    mapping(bytes20 => mapping(Role => bool)) public claimed;

    /// ====== EVENTS ====== ///

    /** @dev Emitted when a referral reward voucher is claimed.
     *  @param referrerHumanityId The humanity ID of the referrer.
     *  @param refereeHumanityId The humanity ID of the referred human.
     *  @param role The side of the referral being paid.
     *  @param beneficiary The Humanity's owner that received the reward.
     *  @param token The ERC20 token paid for this claim.
     *  @param amount The amount of tokens paid.
     */
    event Claimed(
        bytes20 indexed referrerHumanityId,
        bytes20 indexed refereeHumanityId,
        Role indexed role,
        address beneficiary,
        address token,
        uint256 amount
    );

    /** @dev Emitted when the owner changes the reward token.
     *  @param oldToken The previous reward token address.
     *  @param newToken The new reward token address.
     */
    event TokenChanged(address indexed oldToken, address indexed newToken);

    /** @dev Emitted when the owner changes the cross chain Proof of Humanity contract.
     *  @param oldCrossChainProofOfHumanity The previous cross chain Proof of Humanity contract.
     *  @param newCrossChainProofOfHumanity The new cross chain Proof of Humanity contract.
     */
    event CrossChainProofOfHumanityChanged(
        address indexed oldCrossChainProofOfHumanity,
        address indexed newCrossChainProofOfHumanity
    );

    /** @dev Emitted when the owner changes the backend voucher signer.
     *  @param oldSigner The previous voucher signer.
     *  @param newSigner The new voucher signer.
     */
    event VoucherSignerChanged(address indexed oldSigner, address indexed newSigner);

    /** @dev Emitted when the owner changes the maximum voucher amount.
     *  @param oldMaxAmount The previous maximum token amount.
     *  @param newMaxAmount The new maximum token amount.
     */
    event MaxAmountChanged(uint256 oldMaxAmount, uint256 newMaxAmount);

    /** @dev Emitted when the owner withdraws reward tokens.
     *  @param to The address that received the withdrawn tokens.
     *  @param amount The amount of tokens withdrawn.
     */
    event Withdrawn(address indexed to, uint256 amount);

    /** @dev Emitted when ownership of the contract is transferred.
     *  @param oldOwner The previous owner.
     *  @param newOwner The new owner.
     */
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    /// ====== MODIFIERS ====== ///

    /** @notice Restricts a function to the current owner.
     *  @dev Reverts if the caller is not `owner`.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    /// ====== CONSTRUCTOR ====== ///

    /** @notice Initializes the referral reward distributor.
     *  @param _token The ERC20 token to distribute.
     *  @param _maxAmount The maximum token amount a single voucher can authorize.
     *  @param _crossChainProofOfHumanity The cross chain Proof of Humanity contract used to resolve humanity owners.
     *  @param _voucherSigner The backend signer that authorizes reward vouchers.
     */
    constructor(
        address _token,
        uint256 _maxAmount,
        ICrossChainProofOfHumanity _crossChainProofOfHumanity,
        address _voucherSigner
    ) {
        require(_token != address(0), "invalid token");
        require(address(_crossChainProofOfHumanity) != address(0), "invalid poh");
        require(_voucherSigner != address(0), "invalid signer");

        token = IERC20(_token);
        maxAmount = _maxAmount;
        owner = msg.sender;
        crossChainProofOfHumanity = _crossChainProofOfHumanity;
        voucherSigner = _voucherSigner;

        REFERRAL_REWARD_TYPEHASH = keccak256(
            "ReferralReward(bytes20 referrerHumanityId,bytes20 refereeHumanityId,uint8 role,uint256 expireAt,uint256 amount,address token)"
        );

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256("PoH Referral Reward Distributor"),
                block.chainid,
                address(this)
            )
        );
    }

    /// ====== GOVERNANCE ====== ///

    /** @notice Transfers ownership of the contract to a new address.
     *  @param _newOwner The new owner address.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "invalid owner");
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }

    /** @notice Changes the backend signer that authorizes referral reward vouchers.
     *  @dev Existing unclaimed vouchers signed by the previous signer become invalid immediately.
     *  @param _newSigner The new voucher signer address.
     */
    function setVoucherSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "invalid signer");
        address oldSigner = voucherSigner;
        voucherSigner = _newSigner;
        emit VoucherSignerChanged(oldSigner, _newSigner);
    }

    /** @notice Changes the reward token.
     *  @dev Existing vouchers signed for the previous token become invalid because `token` is included in the
     *  EIP-712 `ReferralReward` payload.
     *  @param _newToken The new ERC20 token address.
     */
    function setToken(address _newToken) external onlyOwner {
        require(_newToken != address(0), "invalid token");
        address oldToken = address(token);
        token = IERC20(_newToken);
        emit TokenChanged(oldToken, _newToken);
    }

    /** @notice Changes the cross chain Proof of Humanity contract used for claim-time ownership resolution.
     *  @param _newCrossChainProofOfHumanity The new cross chain Proof of Humanity contract address.
     */
    function setCrossChainProofOfHumanity(address _newCrossChainProofOfHumanity) external onlyOwner {
        require(_newCrossChainProofOfHumanity != address(0), "invalid poh");
        address oldCrossChainProofOfHumanity = address(crossChainProofOfHumanity);
        crossChainProofOfHumanity = ICrossChainProofOfHumanity(_newCrossChainProofOfHumanity);
        emit CrossChainProofOfHumanityChanged(oldCrossChainProofOfHumanity, _newCrossChainProofOfHumanity);
    }

    /** @notice Changes the maximum amount a single voucher can authorize.
     *  @dev Existing unclaimed vouchers above the new maximum become unclaimable.
     *  @param _newMaxAmount The new maximum token amount.
     */
    function setMaxAmount(uint256 _newMaxAmount) external onlyOwner {
        uint256 oldMaxAmount = maxAmount;
        maxAmount = _newMaxAmount;
        emit MaxAmountChanged(oldMaxAmount, _newMaxAmount);
    }

    /// ====== STATE MODIFIERS ====== ///

    /** @notice Claims a referral reward using a backend signed voucher.
     *  the voucher must be unexpired, within `maxAmount`, and unused for the
     *  `(refereeHumanityId, role)` pair.
     *  @dev For `Role.REFERRER`, the beneficiary is the current owner of `referrerHumanityId`. For
     *  `Role.REFEREE`, the beneficiary is the current owner of `refereeHumanityId`.
     *  @param referrerHumanityId The humanity ID of the referrer.
     *  @param refereeHumanityId The humanity ID of the referred human.
     *  @param role The referral side to pay.
     *  @param expireAt Timestamp after which the voucher can no longer be claimed.
     *  @param amount The token amount to pay.
     *  @param v The `v` value of the ECDSA signature.
     *  @param r The `r` value of the ECDSA signature.
     *  @param s The `s` value of the ECDSA signature.
     */
    function claim(
        bytes20 referrerHumanityId,
        bytes20 refereeHumanityId,
        uint8 role,
        uint256 expireAt,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(_recoverSigner(referrerHumanityId, refereeHumanityId, role, expireAt, amount, v, r, s) == voucherSigner, "invalid signature");
        require(block.timestamp < expireAt, "voucher expired");
        require(role == uint8(Role.REFEREE) || role == uint8(Role.REFERRER), "invalid role");
        require(amount <= maxAmount, "amount too high");
        Role rewardRole = Role(role);
        require(!claimed[refereeHumanityId][rewardRole], "already claimed");

        address referrerAddress = crossChainProofOfHumanity.boundTo(referrerHumanityId);
        address refereeAddress = crossChainProofOfHumanity.boundTo(refereeHumanityId);
        require(referrerAddress != address(0), "invalid referrer");
        require(refereeAddress != address(0), "invalid referee");
        address beneficiary = rewardRole == Role.REFERRER ? referrerAddress : refereeAddress;

        claimed[refereeHumanityId][rewardRole] = true;

        require(token.transfer(beneficiary, amount), "transfer failed");
        emit Claimed(referrerHumanityId, refereeHumanityId, rewardRole, beneficiary, address(token), amount);
    }

    /** @notice Withdraws reward tokens from the contract to the owner.
     *  @dev Only withdraws the currently configured reward token.
     *  @param amount The amount of tokens to withdraw.
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(token.transfer(owner, amount), "transfer failed");
        emit Withdrawn(owner, amount);
    }

    /// ====== INTERNAL ====== ///

    /** @dev Recovers the signer for a ReferralReward EIP-712 typed-data signature.
     *  @param referrerHumanityId The humanity ID of the referrer.
     *  @param refereeHumanityId The humanity ID of the referred human.
     *  @param role The referral side to pay.
     *  @param expireAt Timestamp after which the voucher can no longer be claimed.
     *  @param amount The token amount to pay.
     *  @param v The `v` value of the ECDSA signature.
     *  @param r The `r` value of the ECDSA signature.
     *  @param s The `s` value of the ECDSA signature.
     *  @return signer The recovered signer address.
     */
    function _recoverSigner(
        bytes20 referrerHumanityId,
        bytes20 refereeHumanityId,
        uint8 role,
        uint256 expireAt,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (address) {
        // Same lower-half `s` check used by OpenZeppelin ECDSA to reject malleable signatures:
        // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/094c1a1367b7d9183524a43ee080141f64ca9fb8/contracts/utils/cryptography/ECDSA.sol#L176-L186
        require(uint256(s) <= MAX_VALID_S, "invalid s");
        require(v == 27 || v == 28, "invalid v");

        return ecrecover(
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR,
                    keccak256(
                        abi.encode(
                            REFERRAL_REWARD_TYPEHASH,
                            referrerHumanityId,
                            refereeHumanityId,
                            role,
                            expireAt,
                            amount,
                            address(token)
                        )
                    )
                )
            ),
            v,
            r,
            s
        );
    }
}
