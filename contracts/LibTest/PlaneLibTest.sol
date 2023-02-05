// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

import "../PlaneLib.sol";

contract PlaneLibTest {
    function checkHitState(Plane memory plane, Point memory pt) public pure returns (HitState) {
        return PlaneLib.checkHitState(plane, pt);
    }
}