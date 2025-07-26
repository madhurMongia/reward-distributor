// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title Cross Chain Proof of Humanity Interface.
/// @notice Interface for checking humanity status across chains.
interface ICrossChainProofOfHumanity {
    /// @notice Check if an address is registered as human.
    /// @param _human The address to check.
    /// @return bool Whether the address is registered as human.
    function isHuman(address _human) external view returns (bool);

    /// @notice Get the address bound to a humanity ID.
    /// @param humanityID The humanity ID to check.
    /// @return address The address bound to the humanity ID.
    function boundTo(bytes20 humanityID) external view returns (address);
}