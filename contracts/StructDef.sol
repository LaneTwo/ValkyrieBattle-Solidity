// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EnumDef.sol";
import "./Constants.sol";

struct Point {
    int8 x;
    int8 y;
}

struct Plane {
    Point pos;
    PlaneOrientation orientation;
}

struct GameLayout {
    uint8 allowedPlaneCnt;
    Plane[] planes;    
    uint8[MAP_ROW][MAP_COL] gridState;
}

struct Step{
    uint8 player;
    int8 x;
    int8 y;
    HitState state;
}

struct UserScore{
    address player;
    uint winCnt;
    uint loseCnt;
    uint cheatCnt;
}

struct Match{
    uint gameId;
    uint8 joinedPlayerCnt;
    uint8 maxPlayerCnt;
    uint8 currentTurn; // Variable to rotate the player to attack, first round A attack B, sencond round A attack C, then A -> B, A-> C
    uint8 currentPlayer;
    uint8 playerBeChallenged;    
    uint8[] winners;
    uint8[] leftPlayers;
    uint8[MAX_PLAYER_NUM] crashedPlaneCnt;
    GameState state;
    WinningReason winningReason; 
    GameStepPhase stepPhase;      
    uint256 created;
    uint256 lastMoveTimestamp; // Used for player not responding logic
    uint256 obstableSeed;
    address gameCreator;  
    address challengedByPlayer; // Used to indicate whether other player or game normal ended  
    uint256[MAX_PLAYER_NUM] gameLayoutSaltHash;
    uint256[MAX_PLAYER_NUM] gameLayoutHash;
    address[MAX_PLAYER_NUM] playerAddress;
    // uint256[MAX_PLAYER_NUM][MAX_PLANE_NUM][3] playerLayout;
    GameLayout[MAX_PLAYER_NUM] playerGameLayout;
    mapping(address => uint8) playerIndexMap;
    Step[] attackSteps;
}

struct WorldState{    
    uint totalMatchCnt;
    uint totalOpenMatchCnt;
    uint totalUserCnt;
}