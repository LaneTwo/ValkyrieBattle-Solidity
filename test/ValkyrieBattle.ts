import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { GameState } from "./TypeDef";

describe("ValkyrieBattle", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployValkyrieBattleFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, otherAccount2] = await ethers.getSigners();

    const GameLayoutLib = await ethers.getContractFactory("GameLayoutLib");
    const gameLayoutLib = await GameLayoutLib.deploy();

    const PlaneLib = await ethers.getContractFactory("PlaneLib");
    const planeLib = await PlaneLib.deploy();

    const ValkyrieBattle = await ethers.getContractFactory("ValkyrieBattle", {
      libraries: {
        PlaneLib: planeLib.address,
        // GameLayoutLib: gameLayoutLib.address,        
      },
    });
    const valkyrieBattle = await ValkyrieBattle.deploy();

    return { valkyrieBattle, owner, otherAccount, otherAccount2 };
  }

  describe("Deployment", function () {
    it("Should be initialized", async function () {
      const { valkyrieBattle } = await loadFixture(deployValkyrieBattleFixture);
      const worldState = await valkyrieBattle.getWorldState();

      expect(worldState.totalMatchCnt).to.equal(0);
      expect(worldState.totalOpenMatchCnt).to.equal(0);
      expect(worldState.totalUserCnt).to.equal(0);
    });
  });

  describe("setName", function () {
    it("Should get correct name after set name", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      expect(await valkyrieBattle.userNameMap(owner.address)).to.equal('');
      let tx = await valkyrieBattle.setName("abc");
      await tx.wait();
      expect(await valkyrieBattle.userNameMap(owner.address)).to.equal('abc');
    });

    it("Should trigger name set event", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      expect(await valkyrieBattle.userNameMap(owner.address)).to.equal('');

      await expect(valkyrieBattle.setName("abc"))
      .to.emit(valkyrieBattle, 'UserNameSet')
      .withArgs(owner.address, "abc");

      // let tx = await valkyrieBattle.setName("abc");
      // await tx.wait();
      // expect(await valkyrieBattle.userNameMap(owner.address)).to.equal('abc');
    });

  });

  describe("createNewGame", function () {

    it("Should revert if max player count out of range", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      await expect(valkyrieBattle.createNewGame(1, saltStr)).
        to.be.revertedWith('Max players should within range');

      await expect(valkyrieBattle.createNewGame(4, saltStr)).
        to.be.revertedWith('Max players should within range');        
    });

    it("Should revert if max player count out of range", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      await expect(valkyrieBattle.createNewGame(2, 0)).
        to.be.revertedWith('Game layout salt hash should be valid');
   
    });

    it("Should increase game list and open game list", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const worldState = await valkyrieBattle.getWorldState();

      expect(worldState.totalMatchCnt).to.equal(1);
      expect(worldState.totalOpenMatchCnt).to.equal(1);

      const gameId = (await valkyrieBattle.getOpenMatchList())[0];
      expect((await valkyrieBattle.getOpenMatchList())[0]).to.equal(0);
      const newGame = await valkyrieBattle.matchList(0);

      // console.log(newGame);
      expect(newGame.gameCreator).to.equal(owner.address);
      expect(newGame.gameId).to.equal(0);
      expect(newGame.joinedPlayerCnt).to.equal(1);
      expect(newGame.maxPlayerCnt).to.equal(2);

      const [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);
      // console.log(gameLayoutSaltHash);
      // console.log(gameLayoutHash);
      // console.log(playerAddress);
      // console.log(playerLayout);
      // console.log(attackSteps.length);

      
      expect(gameLayoutSaltHash[0].toHexString()).to.equal(saltStr);
      expect(playerAddress[0]).to.equal(owner.address);
    });

    it("Should set the first player address and layout salt hash", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);
      
      expect(gameLayoutSaltHash[0].toHexString()).to.equal(saltStr);
      expect(playerAddress[0]).to.equal(owner.address);
    });
    
    it("Should emit new game event", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));


      await expect(valkyrieBattle.createNewGame(2, saltStr))
      .to.emit(valkyrieBattle, 'GameCreated')
      .withArgs(owner.address, 0, 2);

    });    
  });

  describe("JoinGame", function () {

    it("Should revert if same user joined twice", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));
      await expect(valkyrieBattle.joinGame(0, saltStr2)).
        to.be.revertedWith('Player already joined game');    
    });

    it("Should revert if not in matching state", async function () {
      const { valkyrieBattle, owner, otherAccount, otherAccount2 } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));

      tx = await valkyrieBattle.connect(otherAccount).joinGame(0, saltStr2);
      await tx.wait();

      const saltStr3 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#3"));

      await expect(valkyrieBattle.connect(otherAccount2).joinGame(0, saltStr3)).
        to.be.revertedWith('Only allow to join on matching state');    
    });

    it("Should set the first player address and layout salt hash", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);
      
      expect(gameLayoutSaltHash[0].toHexString()).to.equal(saltStr);
      expect(playerAddress[0]).to.equal(owner.address);
    });

    it("Should capture all layout salt and player address correctly", async function () {
      const { valkyrieBattle, owner, otherAccount } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      let [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);
      
      expect(gameLayoutSaltHash[0].toHexString()).to.equal(saltStr);
      expect(playerAddress[0]).to.equal(owner.address);
      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));

      tx = await valkyrieBattle.connect(otherAccount).joinGame(0, saltStr2);
      await tx.wait();
      
      [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);

      
      expect(gameLayoutSaltHash[1].toHexString()).to.equal(saltStr2);
      expect(playerAddress[1]).to.equal(otherAccount.address);

      const newGame = await valkyrieBattle.matchList(0);
      expect(newGame.joinedPlayerCnt).to.equal(2);
      expect(newGame.maxPlayerCnt).to.equal(2);
    });

    it("Should change game state when all players joined", async function () {
      const { valkyrieBattle, owner, otherAccount } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));

      tx = await valkyrieBattle.connect(otherAccount).joinGame(0, saltStr2);
      await tx.wait();
      

      const newGame = await valkyrieBattle.matchList(0);
      expect(newGame.state).to.equal(GameState.WaitingForStart);

    });

    it("Should set obstacle seed when game start", async function () {
      const { valkyrieBattle, owner, otherAccount } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));    


      const newBlockTimestamp = Number((Date.now() / 1000).toFixed());
      await time.setNextBlockTimestamp(newBlockTimestamp);

      const obstacleSeed = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
        [ "uint[3]", "uint" ],
        [[
            ethers.BigNumber.from(saltStr),
            ethers.BigNumber.from(saltStr2),
            0
          ],
          ethers.BigNumber.from(newBlockTimestamp)
        ]
        ));

      tx = await valkyrieBattle.connect(otherAccount).joinGame(0, saltStr2)
      await tx.wait();

      const newGame = await valkyrieBattle.matchList(0);
      expect(newGame.obstableSeed).to.equal(obstacleSeed);
    });
    
    it("Should emit all players ready", async function () {
      const { valkyrieBattle, owner, otherAccount } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));    


      const newBlockTimestamp = Number((Date.now() / 1000).toFixed());

      await time.setNextBlockTimestamp(newBlockTimestamp);

      const obstacleSeed = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
        [ "uint[3]", "uint" ],
        [[
            ethers.BigNumber.from(saltStr),
            ethers.BigNumber.from(saltStr2),
            0
          ],
          ethers.BigNumber.from(newBlockTimestamp)
        ]
        ));

      await expect(valkyrieBattle.connect(otherAccount).joinGame(0, saltStr2))
        .to.emit(valkyrieBattle, 'GameAllPlayerJoined')
        .withArgs(0, obstacleSeed);
    });    
  });  


  describe("setGameLayout", function () {

    it("Should revert if not in waiting for start state", async function () {
      const { valkyrieBattle, owner } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const layoutHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1_layout"));

      await expect(valkyrieBattle.setGameLayout(0, layoutHash1)).
        to.be.revertedWith('Only allow to update when waiting for start');    
    });

    it("Should revert if user is not game player", async function () {
      const { valkyrieBattle, owner, otherAccount, otherAccount2 } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));

      tx = await valkyrieBattle.connect(otherAccount).joinGame(0, saltStr2);
      await tx.wait();

      const saltStr3 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#3"));

      await expect(valkyrieBattle.connect(otherAccount2).setGameLayout(0, saltStr3)).
        to.be.revertedWith('Only game player allowed');    
    });



    it("Should set the layout correctly", async function () {
      const { valkyrieBattle, owner, otherAccount } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));

      tx = await valkyrieBattle.connect(otherAccount).joinGame(0, saltStr2);
      await tx.wait();

      const layoutHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1_layout"));

      tx = await valkyrieBattle.connect(otherAccount).setGameLayout(0, layoutHash1);
      await tx.wait();

      let [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);
      
      expect(gameLayoutHash[1].toHexString()).to.equal(layoutHash1);

      const layoutHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2_layout"));

      tx = await valkyrieBattle.setGameLayout(0, layoutHash2);
      await tx.wait();

      [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);
      
      expect(gameLayoutHash[0].toHexString()).to.equal(layoutHash2);

    });


    it("Should change game state when all players joined", async function () {
     
      const { valkyrieBattle, owner, otherAccount } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));

      tx = await valkyrieBattle.connect(otherAccount).joinGame(0, saltStr2);
      await tx.wait();

      const layoutHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1_layout"));

      tx = await valkyrieBattle.connect(otherAccount).setGameLayout(0, layoutHash1);
      await tx.wait();

      let [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);
      
      expect(gameLayoutHash[1].toHexString()).to.equal(layoutHash1);

      const layoutHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2_layout"));

      tx = await valkyrieBattle.setGameLayout(0, layoutHash2);
      await tx.wait();

      [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);
      
      expect(gameLayoutHash[0].toHexString()).to.equal(layoutHash2);

      const newGame = await valkyrieBattle.matchList(0);
      expect(newGame.state).to.equal(GameState.GameInProgress);

    });
    
    it("Should emit game started event", async function () {
      const { valkyrieBattle, owner, otherAccount } = await loadFixture(deployValkyrieBattleFixture);

      const saltStr = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1"));

      let tx = await valkyrieBattle.createNewGame(2, saltStr);
      await tx.wait();

      const saltStr2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2"));

      tx = await valkyrieBattle.connect(otherAccount).joinGame(0, saltStr2);
      await tx.wait();

      const layoutHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#1_layout"));

      tx = await valkyrieBattle.connect(otherAccount).setGameLayout(0, layoutHash1);
      await tx.wait();

      let [gameLayoutSaltHash, 
        gameLayoutHash, 
        playerAddress,
        uintattackSteps] = await valkyrieBattle.getGameState(0);
      
      expect(gameLayoutHash[1].toHexString()).to.equal(layoutHash1);

      const layoutHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#2_layout"));

      await expect(valkyrieBattle.setGameLayout(0, layoutHash2))
        .to.emit(valkyrieBattle, 'GameStarted')
        .withArgs(0);
    });    
  });  
});
