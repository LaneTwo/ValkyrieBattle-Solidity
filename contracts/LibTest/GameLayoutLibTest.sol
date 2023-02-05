// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

import "../GameLayoutLib.sol";

contract GameLayoutLibTest {
    GameLayout public gameRet;
    bool public callResult;

    function setGame(GameLayout memory game) public {
        gameRet.allowedPlaneCnt = game.allowedPlaneCnt;
        gameRet.gridState = game.gridState;
        delete gameRet.planes;

        for(uint8 i = 0; i < game.planes.length; i++){
            gameRet.planes.push(game.planes[i]);
        }
        gameRet.allowedPlaneCnt = game.allowedPlaneCnt;
    }

    function getGame() public view returns (GameLayout memory) {
        return gameRet;
    }

    function addPlane(Plane memory plane) public{
        callResult = GameLayoutLib.addPlane(gameRet, plane);
    }

    function shootAt(Point memory point) public view returns (HitState) {
        return GameLayoutLib.shootAt(gameRet, point);
    }
}