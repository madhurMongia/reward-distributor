// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../../contracts/interfaces/ICrossChainProofOfHumanity.sol";

/**
 * @title MockCrossChainProofOfHumanity
 * @notice A mock Cross Chain Proof of Humanity contract for testing purposes.
 */
contract MockCrossChainProofOfHumanity is ICrossChainProofOfHumanity {
    mapping(address => bool) private _isHuman;
    mapping(address => bytes20) private _humanityOf;
    
    /**
     * @notice Sets whether an address is considered human.
     * @param _human The address to set human status for.
     * @param _status Whether the address is human or not.
     */
    function setIsHuman(address _human, bool _status) external {
        _isHuman[_human] = _status;
    }
    
    /**
     * @notice Sets the humanity ID for an address.
     * @param _human The address to set humanity ID for.
     * @param humanityID The humanity ID to set.
     */
    function setHumanityOf(address _human, bytes20 humanityID) external {
        _humanityOf[_human] = humanityID;
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
     * @notice Gets the humanity ID for an address.
     * @param _human The address to get the humanity ID for.
     * @return The humanity ID for the address.
     */
    function humanityOf(address _human) external view override returns (bytes20) {
        return _humanityOf[_human];
    }

    function boundTo(bytes20 humanityID) external view override returns (address) {
        for (uint256 i = 0; i < _humans.length; i++) {
            address human = _humans[i];
            if (_humanityOf[human] == humanityID && _isHuman[human]) {
                return human;
            }
        }

        return address(0);
    }
    
    /**
     * @notice Helper function to set up a complete human verification.
     * @param humanityID The humanity ID.
     * @param _address The address to bind and mark as human.
     */
    function setupHuman(bytes20 humanityID, address _address) external {
        if (_humanityOf[_address] == bytes20(0x0)) {
            _humans.push(_address);
        }
        _humanityOf[_address] = humanityID;
        _isHuman[_address] = true;
    }

    address[] private _humans;
}
