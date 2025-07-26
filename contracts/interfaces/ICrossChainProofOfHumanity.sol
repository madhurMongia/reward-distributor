// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface ICrossChainProofOfHumanity {
    function isHuman(address _human) external view returns (bool);
    function boundTo(bytes20 humanityID) external view returns (address);
}