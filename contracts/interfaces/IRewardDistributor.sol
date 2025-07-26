/** @authors: [@madhurMongia]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 *  SPDX-License-Identifier: MIT
 */

pragma solidity ^0.8.25;

import "./IERC20.sol";
import "./ICrossChainProofOfHumanity.sol";

interface IRewardDistributor {

    function claimed(bytes20 humanityID) external view returns (bool);
    function withdraw(uint256 amount) external;
}