import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

import { HitState, Plane, PlaneOrientation, Point, GameLayout } from './TypeDef';

xdescribe("GameLayoutLib", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployGameLayoutLibFixture() {

    const GameLayoutLib = await ethers.getContractFactory("GameLayoutLib");
    const gameLayoutLib = await GameLayoutLib.deploy();

    const PlaneLib = await ethers.getContractFactory("PlaneLib");
    const planeLib = await PlaneLib.deploy();

    const GameLayoutLibTest = await ethers.getContractFactory("GameLayoutLibTest", {
      libraries: {
        // GameLayoutLib: gameLayoutLib.address,
        PlaneLib: planeLib.address,
      },
    });
    const gameLayoutLibTest = await GameLayoutLibTest.deploy();

    return { gameLayoutLibTest };
  }

  describe("AddPlane", function () {
    it("Should add plane fail if out of border", async function () {
      const { gameLayoutLibTest } = await loadFixture(deployGameLayoutLibFixture);
      const pt: Point = {x: -1, y:0};
      let plane: Plane = {
        pos: pt,
        orientation: PlaneOrientation.Top
      }

      const game: GameLayout = {
        allowedPlaneCnt: 1,
        planes: [],    
        gridState:  Array(10).fill(0).map(x => Array(10).fill(0))
      }
      let tx = await gameLayoutLibTest.setGame(game);
      await tx.wait();
      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(false);
      let ret = await gameLayoutLibTest.getGame();
      expect(ret.planes.length).to.equal(0);
      
      
      // Out of bottom border
      plane = {
        pos: {x: 5, y: 9},
        orientation: PlaneOrientation.Top
      }
      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(false);
      ret = await gameLayoutLibTest.getGame();
      expect(ret.planes.length).to.equal(0);

      //await expect(gameLayoutLibTest.addPlane(plane)).to.be.revertedWith('Planes should be within board border');


      // Out of right border
      plane = {
        pos: {x: 8, y: 0},
        orientation: PlaneOrientation.Top
      }
      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(false);
      ret = await gameLayoutLibTest.getGame();
      expect(ret.planes.length).to.equal(0);

      //TODO: add more test case for different out of border case
    });

    it("Should be able to add plane if position is good", async function () {
      const { gameLayoutLibTest } = await loadFixture(deployGameLayoutLibFixture);
      const pt: Point = {x: 5, y:0};
      let plane: Plane = {
        pos: pt,
        orientation: PlaneOrientation.Top
      }

      const game: GameLayout = {
        allowedPlaneCnt: 1,
        planes: [],    
        gridState:  Array(10).fill(0).map(x => Array(10).fill(0))
      }

      let tx = await gameLayoutLibTest.setGame(game);
      await tx.wait();
      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(true);
      let ret = await gameLayoutLibTest.getGame();
      expect(ret.planes.length).to.equal(1);
      expect(ret.planes[0].orientation).to.equal(PlaneOrientation.Top);
      expect(ret.planes[0].pos.x).to.equal(pt.x);
      expect(ret.planes[0].pos.y).to.equal(pt.y);
      expect(ret.gridState[pt.x][pt.y]).to.equal(1);
      expect(ret.gridState[pt.x+1][pt.y]).to.equal(0);
      expect(ret.gridState[pt.x][pt.y+1]).to.equal(1);
 
    });

    it("Should add plane fail if more than allowed planes added", async function () {
      const { gameLayoutLibTest } = await loadFixture(deployGameLayoutLibFixture);
      const pt: Point = {x: 5, y:0};
      let plane: Plane = {
        pos: pt,
        orientation: PlaneOrientation.Top
      }

      const game: GameLayout = {
        allowedPlaneCnt: 1,
        planes: [],    
        gridState:  Array(10).fill(0).map(x => Array(10).fill(0))
      }

      let tx = await gameLayoutLibTest.setGame(game);
      await tx.wait();
      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(true);
      plane.pos = {
        x: 5,
        y: 9
      }
      plane.orientation = PlaneOrientation.Bottom;

      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(false);
      let ret = await gameLayoutLibTest.getGame();
      expect(ret.planes.length).to.equal(1);
      expect(ret.planes[0].orientation).to.equal(PlaneOrientation.Top);
      expect(ret.planes[0].pos.y).to.equal(0);
    });

    it("Should add plane fail if planes overlap", async function () {
      const { gameLayoutLibTest } = await loadFixture(deployGameLayoutLibFixture);
      const pt: Point = {x: 5, y:0};
      let plane: Plane = {
        pos: pt,
        orientation: PlaneOrientation.Top
      }

      const game: GameLayout = {
        allowedPlaneCnt: 2,
        planes: [],    
        gridState:  Array(10).fill(0).map(x => Array(10).fill(0))
      }

      let tx = await gameLayoutLibTest.setGame(game);
      await tx.wait();
      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(true);
      plane.pos = {
        x: 7,
        y: 0
      }
      plane.orientation = PlaneOrientation.Top;

      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(false);
      let ret = await gameLayoutLibTest.getGame();
      expect(ret.planes.length).to.equal(1);
      expect(ret.planes[0].orientation).to.equal(PlaneOrientation.Top);
      expect(ret.planes[0].pos.y).to.equal(0);
    });    

    it("Should be able to add multiple planes if no overlap", async function () {
      const { gameLayoutLibTest } = await loadFixture(deployGameLayoutLibFixture);
      const pt: Point = {x: 2, y:0};
      let plane: Plane = {
        pos: pt,
        orientation: PlaneOrientation.Top
      }

      const game: GameLayout = {
        allowedPlaneCnt: 3,
        planes: [],    
        gridState:  Array(10).fill(0).map(x => Array(10).fill(0))
      }

      let tx = await gameLayoutLibTest.setGame(game);
      await tx.wait();
      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(true);
      plane.pos = {
        x: 7,
        y: 0
      }
      plane.orientation = PlaneOrientation.Top;

      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(true);
      let ret = await gameLayoutLibTest.getGame();
      expect(ret.planes.length).to.equal(2);
      expect(ret.planes[1].orientation).to.equal(PlaneOrientation.Top);
      expect(ret.planes[1].pos.y).to.equal(0);

      plane.pos = {
        x: 5,
        y: 5
      }
      plane.orientation = PlaneOrientation.Top;

      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(true);
      ret = await gameLayoutLibTest.getGame();
      expect(ret.planes.length).to.equal(3);
      expect(ret.planes[2].orientation).to.equal(PlaneOrientation.Top);
      expect(ret.planes[2].pos.y).to.equal(5);
    });

    
  });

  describe("shootAt", function () {
    it("Should return correctly when attack on plane", async function () {
      const { gameLayoutLibTest } = await loadFixture(deployGameLayoutLibFixture);
      const pt: Point = {x: 2, y:0};
      let plane: Plane = {
        pos: pt,
        orientation: PlaneOrientation.Top
      }

      const game: GameLayout = {
        allowedPlaneCnt: 3,
        planes: [],    
        gridState:  Array(10).fill(0).map(x => Array(10).fill(0))
      }

      let tx = await gameLayoutLibTest.setGame(game);
      await tx.wait();
      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(true);


      plane.pos = {
        x: 7,
        y: 0
      }
      plane.orientation = PlaneOrientation.Top;

      tx = await gameLayoutLibTest.addPlane(plane);
      await tx.wait();
      expect(await gameLayoutLibTest.callResult()).to.equal(true);
      let ret = await gameLayoutLibTest.getGame();
      expect(ret.planes.length).to.equal(2);

      let pt2 = {x:2, y: 0};
      expect(await gameLayoutLibTest.shootAt(pt2)).to.equal(HitState.Crash);

      pt2 = {x: 0, y:1};
      expect(await gameLayoutLibTest.shootAt(pt2)).to.equal(HitState.Hit);

      pt2 = {x: 5, y:5};
      expect(await gameLayoutLibTest.shootAt(pt2)).to.equal(HitState.Miss);

      pt2 = {x: 8, y:3};
      expect(await gameLayoutLibTest.shootAt(pt2)).to.equal(HitState.Hit);

      //TODO: add more unit test cases
    });
  });
});
