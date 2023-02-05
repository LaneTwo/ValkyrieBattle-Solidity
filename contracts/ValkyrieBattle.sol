// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "./PlaneLib.sol";
import "./GameLayoutLib.sol";

contract ValkyrieBattle {
    using PlaneLib for Plane;
    using GameLayoutLib for GameLayout;

    mapping(address => uint) public userScoreMap;
    mapping(address => uint[]) public userMatchMap;
    mapping(address => string) public userNameMap;
    UserScore[] public leaderboardList;

    Match[] public matchList;
    uint[] private openMatchList;

    event UserNameSet(address user, string name);
    event GameCreated(address creator, uint gameId, uint maxPlayerCnt);
    event GameAllPlayerJoined(uint gameId, uint obstableSeed);
    event GameStarted(uint gameId);
    event AttackOnPlayer(address player, Point pt);
    event ReportAttackResult(address player, Point pt, HitState state);
    event ChallengeRequested(address player);
    event GameEnd(uint gameId);
    event LeaderBoardUpdate(uint[] itemIndex);


    constructor() {

    }

    modifier validGame(uint gameId) {
        require(gameId < matchList.length, "Invalid game id");
        _;
    }

    function _isAddressInArray(address[MAX_PLAYER_NUM] storage addressList, address item) private view returns (bool){
        for(uint i = 0; i < addressList.length; i++){
            if(addressList[i] == item){
                return true;
            }
        }
        return false;
    }

    function _isLayoutHashCheating(Match storage game, uint salt, uint[MAX_PLANE_NUM][3] calldata layout, uint playerBeChallenged) private view returns (bool){
        uint layoutSaltHash = uint(keccak256(abi.encodePacked(salt)));
        uint gameLayoutHash = uint(keccak256(abi.encodePacked(salt, layout)));

        return game.gameLayoutSaltHash[playerBeChallenged] != layoutSaltHash ||
            game.gameLayoutHash[playerBeChallenged] != gameLayoutHash;
    }

    function _isLayoutCheating(GameLayout storage gameLayout, uint[MAX_PLANE_NUM][3] memory layout) private returns (bool){
        bool cheating = false;
        for(uint planeIndex = 0; planeIndex < MAX_PLANE_NUM; planeIndex++){
            Point memory pos = Point({ 
                x: int8(uint8(layout[planeIndex][0])), 
                y: int8(uint8(layout[planeIndex][1]))});
            bool result = gameLayout.addPlane(Plane({
                pos: pos,
                orientation: PlaneOrientation(layout[planeIndex][2])
            }));
            if(!result){
                cheating = true;
                break;
            }
        }

        return cheating;
    }

    function _isCheating(Match storage game, uint salt, uint[MAX_PLANE_NUM][3] calldata layout, uint playerBeChallenged) private returns (bool) {
        bool isCheating = _isLayoutHashCheating(game, salt, layout, playerBeChallenged);
        if(!isCheating){
            GameLayout storage gameLayout = game.playerGameLayout[playerBeChallenged];
            gameLayout.allowedPlaneCnt = uint8(MAX_PLANE_NUM);
            isCheating = _isLayoutCheating(gameLayout, layout);
            if(!isCheating){
                isCheating = _isObstacleCheating(game, salt, gameLayout);
                if(!isCheating){
                    isCheating = _isAttackResultReportCheating(game, gameLayout, playerBeChallenged);
                }
            }
        }

        return isCheating;
    }

    function _isObstacleCheating(Match storage game, uint salt, GameLayout storage gameLayout) private view returns (bool){
        uint obstacleSeed1 = uint(keccak256(abi.encodePacked(salt, game.obstableSeed)));
        uint obstacle1 = obstacleSeed1 % (MAP_ROW * MAP_COL);
        uint obstacleSeed2 = uint(keccak256(abi.encodePacked(salt, game.obstableSeed, obstacleSeed1)));
        uint obstacle2 = obstacleSeed2 % (MAP_ROW * MAP_COL - 1);
        uint obstacleSeed3 = uint(keccak256(abi.encodePacked(salt, game.obstableSeed, obstacleSeed2)));
        uint obstacle3 = obstacleSeed3 % (MAP_ROW * MAP_COL - 2);
        bool obstacleIndexIncreasing = false;
        if(obstacle2 >= obstacle1){
            obstacle2++;
            obstacleIndexIncreasing = true;
        }
        if(obstacleIndexIncreasing){
            if(obstacle3 >= obstacle1 && obstacle3 < obstacle2){
                obstacle3++;
            }else{
                obstacle3 += 2;
            }
        }else{
            if(obstacle3 >= obstacle2 && obstacle3 < obstacle1){
                obstacle3++;
            }else{
                obstacle3 += 2;
            }
        }

        uint8 obstaclePosValueSum = gameLayout.gridState[obstacle1 / MAP_ROW][obstacle1 % MAP_ROW] + 
            gameLayout.gridState[obstacle2 / MAP_ROW][obstacle2 % MAP_ROW] +
            gameLayout.gridState[obstacle3 / MAP_ROW][obstacle3 % MAP_ROW];

        // If grid vlaue >=1 then means user place plane on obstacle -> cheating
        return obstaclePosValueSum >= 1;
    }

    function _isAttackResultReportCheating(Match storage game, GameLayout storage gameLayout, uint playerBeChallenged) private view returns(bool){
        bool isCheating = false;
        for(uint stepIndex = 0; stepIndex < game.attackSteps.length; stepIndex++){
            Step storage step = game.attackSteps[stepIndex];
            if(step.player == playerBeChallenged){
                if(step.state != HitState.Invalid){
                    if(gameLayout.shootAt(Point({x: step.x, y: step.y})) != step.state){
                        isCheating = true;
                        break;
                    }
                } 
            }
        }
        return isCheating;
    }

    function _increaseUserScore(uint gameId, address player, UserScoreType scoreType) private returns (uint){
        uint userScoreIndex = userScoreMap[player];
        bool isNewPlayer = false;
        // Need to additional check to see whether the item doesn't exist in map and with index = 0
        if(userScoreIndex == 0 && leaderboardList.length > 0){
            if(leaderboardList[userScoreIndex].player != player){
                isNewPlayer = true;
            }
        }else{
            isNewPlayer = true;
        }

        if(isNewPlayer){
            userScoreIndex = leaderboardList.length;
            UserScore memory score;
            score.player = player;
            leaderboardList.push(score);
            userMatchMap[player].push(gameId);
        }

        if(scoreType == UserScoreType.Win){
            leaderboardList[userScoreIndex].winCnt++;
        }else if(scoreType == UserScoreType.Lose){
            leaderboardList[userScoreIndex].loseCnt++;
        }else{
            leaderboardList[userScoreIndex].cheatCnt++;
        }

        return userScoreIndex;
    }

    function setName(string memory name) external {
        userNameMap[msg.sender] = name;
        emit UserNameSet(msg.sender, name);
    }
    
    function getWorldState () external view returns(WorldState memory){
        return WorldState({
            totalMatchCnt : matchList.length,
            totalOpenMatchCnt: openMatchList.length,
            totalUserCnt: leaderboardList.length
        });
    }

    function getOpenMatchList() external view returns(uint[] memory){
        uint[] memory result;
        //TODO: maybe we can set a counter for gameId and start from 1, then after delete open game id, we can easily filter the left open games
        uint totalOpenedGame = 0;
        for(uint i = 0; i < openMatchList.length; i++){
            if(openMatchList[i] > 0){
                totalOpenedGame++;
            }
        }
        uint startIndex = 0;
        if(matchList.length > 0 && matchList[0].state == GameState.WaitingForMatch){
            totalOpenedGame++;
            result = new uint[](totalOpenedGame);
            result[0] = 0;
            startIndex++;
        }else{
            result = new uint[](totalOpenedGame);
        }

        for(uint i = 0; i < openMatchList.length; i++){
            if(openMatchList[i] > 0){
                result[startIndex] = openMatchList[i];
                startIndex++;
            }
        }
        return result;
    }

    function createNewGame(uint8 maxPlayerCnt, uint gameLayoutSaltHash) external {
        require(
            maxPlayerCnt >= 2 && maxPlayerCnt <= MAX_PLAYER_NUM,
            "Max players should within range"
        ); 
        require(
            gameLayoutSaltHash != 0,
            "Game layout salt hash should be valid"
        );       

        uint gameId = matchList.length; 
        openMatchList.push(gameId);
        Match storage newMatch = matchList.push(); 
        newMatch.gameId = gameId;
        newMatch.maxPlayerCnt = maxPlayerCnt;        
        newMatch.created = block.timestamp;
        newMatch.gameCreator = msg.sender; 
        newMatch.playerAddress[newMatch.joinedPlayerCnt] = msg.sender;
        newMatch.gameLayoutSaltHash[newMatch.joinedPlayerCnt] = gameLayoutSaltHash;
        newMatch.playerIndexMap[msg.sender] = newMatch.joinedPlayerCnt;
        newMatch.leftPlayers.push(newMatch.joinedPlayerCnt);
        newMatch.joinedPlayerCnt++;   

        emit GameCreated(msg.sender, gameId, maxPlayerCnt);
    }

    function getGameState(uint gameId) view external validGame(gameId) returns(uint[MAX_PLAYER_NUM] memory gameLayoutSaltHash, 
        uint[MAX_PLAYER_NUM] memory gameLayoutHash, 
        address[MAX_PLAYER_NUM] memory playerAddress,
        Step[] memory attackSteps,
        uint8[] memory winners
    ){
        Match storage game = matchList[gameId];

        return (game.gameLayoutSaltHash, 
            game.gameLayoutHash, 
            game.playerAddress, 
            game.attackSteps,
            game.winners);
    }

    function joinGame(uint gameId, uint gameLayoutSaltHash) external validGame(gameId) {
        Match storage game = matchList[gameId];

        require(game.state == GameState.WaitingForMatch, "Only allow to join on matching state");
        require(!_isAddressInArray(game.playerAddress, msg.sender), "Player already joined game");

        game.playerAddress[game.joinedPlayerCnt] = msg.sender;
        game.gameLayoutSaltHash[game.joinedPlayerCnt] = gameLayoutSaltHash;
        game.playerIndexMap[msg.sender] = game.joinedPlayerCnt;
        game.leftPlayers.push(game.joinedPlayerCnt);
        game.joinedPlayerCnt++; 
        
        if(game.joinedPlayerCnt >= game.maxPlayerCnt){
            game.state = GameState.WaitingForStart;

            for(uint i = 0; i < openMatchList.length; i++){
                if(openMatchList[i] == gameId){
                    delete openMatchList[i];
                }
            }

            uint obstableSeed = uint(
                keccak256(
                    abi.encodePacked(
                        game.gameLayoutSaltHash,
                        block.timestamp
                    )
                )
            );
            game.obstableSeed = obstableSeed;
            emit GameAllPlayerJoined(gameId, obstableSeed);            
        }
    }

    function setGameLayout(uint gameId, uint gameHash) validGame(gameId) external {
        Match storage game = matchList[gameId];

        require(game.state == GameState.WaitingForStart, "Only allow to update when waiting for start");
        require(_isAddressInArray(game.playerAddress, msg.sender), "Only game player allowed");

        //TODO: add timeout logic if one of the player not responding to set game layout
        game.gameLayoutHash[game.playerIndexMap[msg.sender]] = gameHash;

        bool allPlayersReady = true;
        for(uint i = 0; i < game.maxPlayerCnt; i++){
            if(game.gameLayoutHash[i] == 0) {
                allPlayersReady = false;
                break;
            }
        }

        if(allPlayersReady){
            game.state = GameState.GameInProgress;
            emit GameStarted(gameId);
        }
    }

    function getCurrentPlayer(uint gameId) public view validGame(gameId) returns(uint playerIndex, address player){
        Match storage game = matchList[gameId];
        require(game.state == GameState.GameInProgress, "Game not in progress");

        uint currentPlayer = game.leftPlayers[game.currentPlayer];
        return (currentPlayer, game.playerAddress[currentPlayer]);
    }

    function getPlayerUnderAttack(uint gameId) public view validGame(gameId) returns(uint playerIndex, address player){
        Match storage game = matchList[gameId];

        require(game.state == GameState.GameInProgress, "Game not in progress");

        uint playerUnderAttack = game.currentPlayer + 1 + game.currentTurn;
        if(playerUnderAttack >= game.leftPlayers.length){
            playerUnderAttack -= game.leftPlayers.length;
        }

        playerUnderAttack = game.leftPlayers[playerUnderAttack];

        return (playerUnderAttack, game.playerAddress[playerUnderAttack]);
    }

    function attack(uint gameId, Point calldata pt) external validGame(gameId) {
        uint player;
        address playerAddress;
        uint playerUnderAttack;
        address playerUnderAttackAddress;

        (player, playerAddress) = getCurrentPlayer(gameId);
        Match storage game = matchList[gameId];

        require(game.state == GameState.GameInProgress, "Game not in progress");
        require(playerAddress == msg.sender, "Only current player can move");
        require(game.stepPhase == GameStepPhase.Attack, "Attack can only be performed on attack phase");
        require(pt.x >= 0 && pt.x < int(MAP_ROW) && pt.y >=0 && pt.y < int(MAP_COL), "Point is out of board");

        (playerUnderAttack, playerUnderAttackAddress) = getPlayerUnderAttack(gameId);
        game.attackSteps.push(Step({
            player: uint8(playerUnderAttack),
            x: pt.x,
            y: pt.y,
            state: HitState.Invalid
        }));
        game.stepPhase = GameStepPhase.Report;

        emit AttackOnPlayer(playerUnderAttackAddress, pt);
    }

    function report(uint gameId, HitState state) external {
        uint player;
        address playerAddress;
        uint playerUnderAttack;
        address playerUnderAttackAddress;

        (player, playerAddress) = getCurrentPlayer(gameId);
        (playerUnderAttack, playerUnderAttackAddress) = getPlayerUnderAttack(gameId);
        Match storage game = matchList[gameId];

        require(game.state == GameState.GameInProgress, "Game not in progress");
        require(playerUnderAttackAddress == msg.sender, "Only current player can move");
        require(game.stepPhase == GameStepPhase.Report, "Report result can only be performed on report phase");

        require(state == HitState.Miss || state == HitState.Hit || state == HitState.Crash, "Attack result invalid");
        
        Step storage lastStep = game.attackSteps[game.attackSteps.length - 1];
        lastStep.state = state;

        bool turnEnd = false;
        if(player == game.leftPlayers.length -1){
            turnEnd = true;            
        }

        if(state == HitState.Crash){
            game.crashedPlaneCnt[playerUnderAttack]++;
            // All planes crashed, remove that player in playing
            if(game.crashedPlaneCnt[playerUnderAttack] >= MAX_PLANE_NUM){
                bool playerDeleted = false;
                for(uint index = 0; index < game.leftPlayers.length - 1; index++){
                    if(game.leftPlayers[index] == playerUnderAttack){
                        playerDeleted = true;
                    }
                    if(playerDeleted){
                        game.leftPlayers[index] = game.leftPlayers[index+1];
                    }
                }

                delete game.leftPlayers[game.leftPlayers.length - 1];
                game.leftPlayers.pop();                
            }
            // Challenge winer to verify not cheating
            if(game.leftPlayers.length <= 1){
                game.state = GameState.CheckingCheating;
                game.playerBeChallenged = game.leftPlayers[0];
                emit ChallengeRequested(game.playerAddress[game.playerBeChallenged]);
                return;
            }
        }

        // Reset turn
        if(turnEnd){
            game.currentTurn++;
            if(game.currentTurn >= game.leftPlayers.length -1){
                game.currentTurn = 0;
            }
        }

        // Move to next player
        game.currentPlayer++;
        if(game.currentPlayer >= game.leftPlayers.length){
            game.currentPlayer = 0;
        }
        
        emit ReportAttackResult(playerUnderAttackAddress, Point({x:lastStep.x, y: lastStep.y}), state);
    }

    function revealLayout(uint gameId, uint salt, uint[MAX_PLANE_NUM][3] calldata layout)  external validGame(gameId) {
        Match storage game = matchList[gameId];
        require(game.state == GameState.CheckingCheating, "Game must be in checking cheating phase");
        require(game.playerAddress[game.playerBeChallenged] == msg.sender, "Player must be challenged");

        address playerAddressBeChallenged = game.playerAddress[game.playerBeChallenged];
        uint[] memory leaderBoardUpdatedIndexArray;

        if(_isCheating(game, salt, layout, game.playerBeChallenged)){
            game.winningReason = WinningReason.Cheating;
            _increaseUserScore(gameId, msg.sender, UserScoreType.Cheating);

            for(uint i = 0; i < game.maxPlayerCnt; i++){
                if(game.playerAddress[i] != playerAddressBeChallenged){
                    if(game.challengedByPlayer != address(0) && game.playerAddress[i] != game.challengedByPlayer){
                        _increaseUserScore(gameId, game.playerAddress[i], UserScoreType.Lose);
                    }else{
                        _increaseUserScore(gameId, game.playerAddress[i], UserScoreType.Win);
                    }
                }
            }
        }else{
            game.winningReason = WinningReason.Normal;
            _increaseUserScore(gameId, playerAddressBeChallenged, UserScoreType.Win);

            for(uint i = 0; i < game.maxPlayerCnt; i++){
                if(game.playerAddress[i] != playerAddressBeChallenged){
                    _increaseUserScore(gameId, game.playerAddress[i], UserScoreType.Lose);
                }
            }
        }

        game.state = GameState.GameEnded;
        emit GameEnd(gameId);
        emit LeaderBoardUpdate(leaderBoardUpdatedIndexArray);
    }

    function challengeUser(uint gameId, uint salt, uint[MAX_PLANE_NUM][3] calldata selfLayout, address challengedUserAddress)  external validGame(gameId) {
        Match storage game = matchList[gameId];
        require(game.state == GameState.CheckingCheating, "Game must be in checking cheating phase");
        require(challengedUserAddress != msg.sender, "Player can only challenge other player");
        require(_isAddressInArray(game.playerAddress, challengedUserAddress), "Only player in game can be challenged");
        require(_isAddressInArray(game.playerAddress, msg.sender), "Only player can rquest cheating challenge");

        game.challengedByPlayer = msg.sender;
        game.playerBeChallenged = game.playerIndexMap[challengedUserAddress];

        uint challengeByUserIndex = game.playerIndexMap[msg.sender];

        // Verify challenger before requesting challenge other player
        if(_isCheating(game, salt, selfLayout, challengeByUserIndex)){

            game.winningReason = WinningReason.Cheating;
            _increaseUserScore(gameId, game.challengedByPlayer, UserScoreType.Cheating);


            for(uint i = 0; i < game.maxPlayerCnt; i++){
                if(game.playerAddress[i] != game.challengedByPlayer){
                    _increaseUserScore(gameId, game.playerAddress[i], UserScoreType.Win);  
                }
            }
            game.state = GameState.GameEnded;
            emit GameEnd(gameId);         
        }else{
            // Emit event and wait other player response
            emit ChallengeRequested(challengedUserAddress);
        }
    }
}
