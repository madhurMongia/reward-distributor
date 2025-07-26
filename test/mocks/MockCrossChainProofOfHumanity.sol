// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../../contracts/interfaces/ICrossChainProofOfHumanity.sol";

/**
 * @title MockCrossChainProofOfHumanity
 * @notice A mock Cross Chain Proof of Humanity contract for testing purposes.
 */
contract MockCrossChainProofOfHumanity is ICrossChainProofOfHumanity {
    mapping(address => bool) private _isHuman;
    mapping(bytes20 => address) private _boundTo;
    
    /**
     * @notice Sets whether an address is considered human.
     * @param _human The address to set human status for.
     * @param _status Whether the address is human or not.
     */
    function setIsHuman(address _human, bool _status) external {
        _isHuman[_human] = _status;
    }
    
    /**
     * @notice Sets the binding between a humanity ID and an address.
     * @param humanityID The humanity ID.
     * @param _address The address to bind to.
     */
    function setBoundTo(bytes20 humanityID, address _address) external {
        _boundTo[humanityID] = _address;
    }
    
    /**
     * @notice Checks if an address is considered human.
     * @param _human The address to check.
     * @return Whether the address is human.
     */
    function isHuman(address _human) external view override returns (bool) {
        return _isHuman[_human];
    }
    
    /**
     * @notice Gets the address bound to a humanity ID.
     * @param humanityID The humanity ID to check.
     * @return The address bound to the humanity ID.
     */
    function boundTo(bytes20 humanityID) external view override returns (address) {
        return _boundTo[humanityID];
    }
    
    /**
     * @notice Helper function to set up a complete human verification.
     * @param humanityID The humanity ID.
     * @param _address The address to bind and mark as human.
     */
    function setupHuman(bytes20 humanityID, address _address) external {
        _boundTo[humanityID] = _address;
        _isHuman[_address] = true;
    }
}