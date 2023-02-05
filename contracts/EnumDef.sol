// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;


enum PlaneOrientation {
    Top,
    Right,
    Bottom,
    Left
} 

enum GameState {
    WaitingForMatch, 
    WaitingForStart, 
    GameInProgress, 
    CheckingCheating,
    GameEnded
}

enum HitState {
    Invalid,
    Miss,
    Hit,
    Crash
}

enum WinningReason {
    Normal,
    Timeout,
    Cheating
}

enum GameStepPhase {
    Attack,
    Report
}

enum UserScoreType {    
    Lose,
    Win,
    Cheating
}
