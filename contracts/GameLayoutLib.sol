// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

import "./StructDef.sol";
import "./PlaneLib.sol";
import "./Constants.sol";

//TODO: need to change public function to internal after unit test
library GameLayoutLib {
    using PlaneLib for Plane;
    // int8 private constant MAP_ROW = 10;
    // int8 private constant MAP_COL = 10;
    // int8 private constant MAX_PLANE_NUM = 3;

    function addPlane(GameLayout storage game, Plane memory plane) internal returns (bool){
        int max_row = int(MAP_ROW);
        int max_col = int(MAP_COL);

        if (game.planes.length >= uint8(MAX_PLANE_NUM) || 
            game.planes.length >= game.allowedPlaneCnt ||
            uint(plane.orientation) > uint(PlaneOrientation.Left)) {
            return false;
        }
        Point memory point = plane.pos;
        bool overlap = false;
        bool outOfBoard = false;
        if (plane.orientation == PlaneOrientation.Top) {
            if (point.x - 2 < 0 || point.x + 2 >= max_col || point.y < 0 || point.y + 3 >= max_row){
                outOfBoard = true;
            //TODO: improve below check logic to compare the 5 * 4 plane grid plus offset with board to reduce the condition and code lines
            } else{
                uint8 posX = uint8(point.x);
                uint8 posY = uint8(point.y);
                if(game.gridState[posX][posY] == 0 && 
                    game.gridState[posX - 2][posY + 1] == 0 && game.gridState[posX - 1][posY + 1] == 0 && game.gridState[posX][posY + 1] == 0 && game.gridState[posX + 1][posY + 1] == 0 && game.gridState[posX + 2][posY + 1] == 0
                        && game.gridState[posX][posY + 2] == 0 && game.gridState[posX - 1][posY + 3] == 0 && game.gridState[posX][posY + 3] == 0 && game.gridState[posX + 1][posY + 3] == 0 ) {
                    //TODO: init plane nose position with 2 rather than 1
                    game.gridState[posX][posY] = 1;
                    game.gridState[posX - 2][posY + 1] = 1;
                    game.gridState[posX - 1][posY + 1] = 1;
                    game.gridState[posX][posY + 1] = 1;
                    game.gridState[posX + 1][posY + 1] = 1;
                    game.gridState[posX + 2][posY + 1] = 1;
                    game.gridState[posX][posY + 2] = 1;
                    game.gridState[posX - 1][posY + 3] = 1;
                    game.gridState[posX][posY + 3] = 1;
                    game.gridState[posX + 1][posY + 3] = 1;
                } else {
                   overlap = true;
                }
            }
        } else if (plane.orientation == PlaneOrientation.Right) {
            if (point.x - 3 < 0 || point.x >= max_col || point.y - 2 < 0 || point.y + 2 >= max_row){
                outOfBoard = true;
            } else{
                uint8 posX = uint8(point.x);
                uint8 posY = uint8(point.y);
                if(game.gridState[posX][posY] == 0 && game.gridState[posX - 1][posY - 2] == 0 && game.gridState[posX - 1][posY - 1] == 0 && game.gridState[posX - 1][posY] == 0 && game.gridState[posX - 1][posY + 1] == 0 && game.gridState[posX - 1][posY + 2] == 0
                    && game.gridState[posX - 2][posY] == 0 && game.gridState[posX - 3][posY - 1] == 0 && game.gridState[posX - 3][posY] == 0 && game.gridState[posX - 3][posY + 1] == 0 ) {

                    game.gridState[posX][posY] = 1;
                    game.gridState[posX - 1][posY - 2] = 1;
                    game.gridState[posX - 1][posY - 1] = 1;
                    game.gridState[posX - 1][posY] = 1;
                    game.gridState[posX - 1][posY + 1] = 1;
                    game.gridState[posX - 1][posY + 2] = 1;
                    game.gridState[posX - 2][posY] = 1;
                    game.gridState[posX - 3][posY - 1] = 1;
                    game.gridState[posX - 3][posY] = 1;
                    game.gridState[posX - 3][posY + 1] = 1;

                } else {
                    overlap = true;
                }
            }
        } else if (plane.orientation == PlaneOrientation.Bottom) {
            if (point.x - 2 < 0 || point.x + 2 >= max_col || point.y - 3 < 0 || point.y >= max_row){
                outOfBoard = true;
            } else{
                uint8 posX = uint8(point.x);
                uint8 posY = uint8(point.y);                
                if(game.gridState[posX][posY] == 0 && game.gridState[posX - 2][posY - 1] == 0 && game.gridState[posX - 1][posY - 1] == 0 && game.gridState[posX][posY - 1] == 0 && game.gridState[posX + 1][posY - 1] == 0 && game.gridState[posX + 2][posY - 1] == 0
                    && game.gridState[posX][posY - 2] == 0 && game.gridState[posX - 1][posY - 3] == 0 && game.gridState[posX][posY - 3] == 0 && game.gridState[posX + 1][posY - 3] == 0 ) {

                    game.gridState[posX][posY] = 1;
                    game.gridState[posX - 2][posY - 1] = 1;
                    game.gridState[posX - 1][posY - 1] = 1;
                    game.gridState[posX][posY - 1] = 1;
                    game.gridState[posX + 1][posY - 1] = 1;
                    game.gridState[posX + 2][posY - 1] = 1;
                    game.gridState[posX][posY - 2] = 1;
                    game.gridState[posX - 1][posY - 3] = 1;
                    game.gridState[posX][posY - 3] = 1;
                    game.gridState[posX + 1][posY - 3] = 1;

                } else {
                    overlap = true;
                }
            }
        } else {
            if (point.x < 0 || point.x + 3 >= max_col || point.y - 2 < 0 || point.y + 2 >= max_row){
                outOfBoard = true;
            } else {
                uint8 posX = uint8(point.x);
                uint8 posY = uint8(point.y);                
                if(game.gridState[posX][posY] == 0 && game.gridState[posX + 1][posY - 2] == 0 && game.gridState[posX + 1][posY - 1] == 0 && game.gridState[posX + 1][posY] == 0 && game.gridState[posX + 1][posY + 1] == 0 && game.gridState[posX + 1][posY + 2] == 0
                    && game.gridState[posX + 2][posY] == 0 && game.gridState[posX + 3][posY - 1] == 0 && game.gridState[posX + 3][posY] == 0 && game.gridState[posX + 3][posY + 1] == 0 ) {

                    game.gridState[posX][posY] = 1;
                    game.gridState[posX + 1][posY - 2] = 1;
                    game.gridState[posX + 1][posY - 1] = 1;
                    game.gridState[posX + 1][posY] = 1;
                    game.gridState[posX + 1][posY + 1] = 1;
                    game.gridState[posX + 1][posY + 2] = 1;
                    game.gridState[posX + 2][posY] = 1;
                    game.gridState[posX + 3][posY - 1] = 1;
                    game.gridState[posX + 3][posY] = 1;
                    game.gridState[posX + 3][posY + 1] = 1;

                    
                } else {
                    overlap = true;
                }
            }
        }

        if(overlap == false && outOfBoard == false){
            game.planes.push(plane);
        }
        
        return overlap == false && outOfBoard == false;
    }
    
    //TODO: we can replace plane hit state check with grid state check
    function shootAt(GameLayout memory game, Point memory point) internal pure returns (HitState) {
        HitState state = HitState.Miss;
        int max_row = int(MAP_ROW);
        int max_col = int(MAP_COL);

        if (point.x >= 0 && point.x < max_col && point.x >= 0 && point.y < max_row){
            for(uint i = 0; i < game.planes.length; i++) {
                state = game.planes[i].checkHitState(point);

                if(state != HitState.Miss){
                    break;
                }
            }
        } 

        return state;
    }
}