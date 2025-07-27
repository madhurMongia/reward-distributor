// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title Cross Chain Proof of Humanity Interface.
/// @notice Interface for checking humanity status across chains.
interface ICrossChainProofOfHumanity {
    /// @notice Check if an address is registered as human.
    /// @param _human The address to check.
    /// @return bool Whether the address is registered as human.
    function isHuman(address _human) external view returns (bool);

    /// @notice Get the humanity ID for an address.
    /// @param _human The address to get the humanity ID for.
    /// @return bytes20 The humanity ID for the address.
    function humanityOf(address _human) external view returns (bytes20);
}