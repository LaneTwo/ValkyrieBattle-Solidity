import { ethers } from "hardhat";

export enum PlaneOrientation {
    Top,
    Right,
    Bottom,
    Left
} 

export enum GameState {
    WaitingForMatch, 
    WaitingForStart, 
    GameInProgress, 
    CheckingCheating,
    GameEnded
}
export enum HitState {
    Invalid,
    Miss,
    Hit,
    Crash
}

export enum WinningReason {
    Normal,
    Timeout,
    Cheat
}

export interface Point {
    x: number;
    y: number;
}

export interface Plane {
    pos: Point;
    orientation: PlaneOrientation;
}



export interface GameLayout {
    allowedPlaneCnt: number;
    planes: Plane[] ;    
    gridState: number[][];
}

export interface Step{
    player: number;
    x: number;
    y: number;
    state: HitState;
}

export interface UserScore{
    player: string;
    winCnt: number;
    loseCnt: number;
    cheatCnt: number;
}

export interface Match{
    gameId: number;
    joinedPlayerCnt: number;
    maxPlayerCnt: number;
    currentPlayer: number;
    currentTurn: number;
    currentAttackedPlayer: number;
    winners: number[];
    crashedPlaneCnt: number[];
    state: GameState;
    WinningReason: WinningReason;       
    created: number;
    lastMoveTimestamp: number;
    gameCreator:string
    gameLayoutSaltHash: any[];
    gameLayoutHash: any[];
    playerAddress: string[];
    playerLayout: number[][][];
    attackSteps: Step[];
}

export interface WorldState{
    totalMatchCnt: number;
    totalOpenMatchCnt: number;
    totalUserCnt: number;
}