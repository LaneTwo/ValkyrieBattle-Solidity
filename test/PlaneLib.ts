import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

import { HitState, Plane, PlaneOrientation, Point } from './TypeDef';

xdescribe("PlaneLib", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPlaneLibFixture() {

    const PlaneLib = await ethers.getContractFactory("PlaneLib");
    const planeLib = await PlaneLib.deploy();

    const PlaneLibTest = await ethers.getContractFactory("PlaneLibTest", {
      libraries: {
        PlaneLib: planeLib.address,
      },
    });
    const planeLibTest = await PlaneLibTest.deploy();

    return { planeLibTest };
  }

  describe("checkHitState", function () {
    it("Should crash when attack on plane nose", async function () {
      const { planeLibTest } = await loadFixture(deployPlaneLibFixture);
      const pt: Point = {x: 5, y:5};
      const plane: Plane = {
        pos: pt,
        orientation: PlaneOrientation.Top
      }
      expect(await planeLibTest.checkHitState(plane, pt)).to.equal(HitState.Crash);
    });
    it("Should miss when doesn't attack on plane", async function () {
      const { planeLibTest } = await loadFixture(deployPlaneLibFixture);
      const pt: Point = {x: 5, y:5};
      const plane: Plane = {
        pos: pt,
        orientation: PlaneOrientation.Top
      }
      let pt2: Point = {x: 5, y:4};
      expect(await planeLibTest.checkHitState(plane, pt2)).to.equal(HitState.Miss);

      pt2 = {x: 5, y:4};
      expect(await planeLibTest.checkHitState(plane, pt2)).to.equal(HitState.Miss);

      pt2 = {x: 4, y:5};
      expect(await planeLibTest.checkHitState(plane, pt2)).to.equal(HitState.Miss);

      pt2 = {x: 6, y:5};
      expect(await planeLibTest.checkHitState(plane, pt2)).to.equal(HitState.Miss);

      //TODO: add more unit test cases
    });

    it("Should be hit when attack on plane", async function () {
      const { planeLibTest } = await loadFixture(deployPlaneLibFixture);
      const pt: Point = {x: 5, y:5};
      const plane: Plane = {
        pos: pt,
        orientation: PlaneOrientation.Top
      }
      let pt2: Point = {x: 5, y:6};
      expect(await planeLibTest.checkHitState(plane, pt2)).to.equal(HitState.Hit);

      pt2 = {x: 5, y:7};
      expect(await planeLibTest.checkHitState(plane, pt2)).to.equal(HitState.Hit);

      pt2 = {x: 5, y:8};
      expect(await planeLibTest.checkHitState(plane, pt2)).to.equal(HitState.Hit);

      pt2 = {x: 3, y:6};
      expect(await planeLibTest.checkHitState(plane, pt2)).to.equal(HitState.Hit);

      pt2 = {x: 4, y:8};
      expect(await planeLibTest.checkHitState(plane, pt2)).to.equal(HitState.Hit);

      //TODO: add more unit test cases
    });
  });
});
