// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title Reward Distributor V2 Interface.
/// @notice Interface for claiming referral rewards with backend signed vouchers.
interface IRewardDistributorV2 {
    /** @notice Claims a referral reward using a backend signed voucher.
     *  @param referrerHumanityId The humanity ID of the referrer.
     *  @param refereeHumanityId The humanity ID of the referred human.
     *  @param role The referral side to pay. 0 = referee, 1 = referrer.
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
    ) external;

    /** @notice Withdraws reward tokens to the owner.
     *  @param amount The amount of tokens to withdraw.
     */
    function withdraw(uint256 amount) external;

    /** @notice Transfers ownership of the contract.
     *  @param _newOwner The new owner address.
     */
    function transferOwnership(address _newOwner) external;

    /** @notice Changes the backend signer that authorizes reward vouchers.
     *  @param _newSigner The new voucher signer address.
     */
    function setVoucherSigner(address _newSigner) external;

    /** @notice Changes the reward token.
     *  @param _newToken The new ERC20 token address.
     */
    function setToken(address _newToken) external;

    /** @notice Changes the cross chain Proof of Humanity contract used to verify ownership.
     *  @param _newCrossChainProofOfHumanity The new cross chain Proof of Humanity contract address.
     */
    function setCrossChainProofOfHumanity(address _newCrossChainProofOfHumanity) external;

    /** @notice Changes the maximum amount a single voucher can authorize.
     *  @param _newMaxAmount The new maximum token amount.
     */
    function setMaxAmount(uint256 _newMaxAmount) external;
}
