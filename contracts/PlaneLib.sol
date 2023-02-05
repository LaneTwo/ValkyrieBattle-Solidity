// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

import "./StructDef.sol";
//TODO: need to change public function to internal after unit test
library PlaneLib {
    //TODO: replace below with grid value check
    function checkHitState(Plane memory plane, Point memory pt) public pure returns (HitState) {
        HitState state = HitState.Miss;
        if(plane.pos.x == pt.x && plane.pos.y == pt.y){
            state = HitState.Crash;
        }else{
            if ( plane.orientation == PlaneOrientation.Top ) {
                if (((pt.y == plane.pos.y + 1) && (pt.x >= plane.pos.x - 2 && pt.x <= plane.pos.x + 2 )) ||
                ((pt.y == plane.pos.y + 2) && (pt.x == plane.pos.x)) || ((pt.y == plane.pos.y + 3) && (pt.x >= plane.pos.x - 1 && pt.x <= plane.pos.x + 1))) {
                   state = HitState.Hit;
                }
            } else if (plane.orientation == PlaneOrientation.Right) {
                if((pt.x == plane.pos.x - 1 ) && (pt.y >= plane.pos.y - 2 && pt.y <= plane.pos.y + 2 ) || (pt.x == plane.pos.x - 2) && (pt.y == plane.pos.y) || (pt.x == plane.pos.x - 3) && (pt.y >= plane.pos.y - 1 && pt.y <= plane.pos.y + 1)){
                    state = HitState.Hit;
                } 
            } else if (plane.orientation == PlaneOrientation.Bottom) {
                if ((pt.x >= plane.pos.x - 2 && pt.x <= plane.pos.x + 2) && (pt.y == plane.pos.y - 1) || (pt.x == plane.pos.x) && (pt.y == plane.pos.y - 2) || (pt.x >= plane.pos.x -1 && pt.x <= plane.pos.x + 1) && (pt.y == plane.pos.y - 3)){
                    state = HitState.Hit;
                } 
            } else {
                if ((pt.x == plane.pos.x + 1) && (pt.y >= plane.pos.y - 2 && pt.y <= plane.pos.y + 2) || (pt.x == plane.pos.x + 2) && (pt.y == plane.pos.y) || (pt.x == plane.pos.x + 3) && (pt.y >= plane.pos.y - 1 && pt.y <= plane.pos.y + 1)) {
                    state = HitState.Hit;
                }
            }
        }

        return state;
    }
}