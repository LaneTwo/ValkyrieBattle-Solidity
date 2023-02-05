import { ethers } from "hardhat";

async function main() {
  const ValkyrieBattle = await ethers.getContractFactory("ValkyrieBattle");
  const valkyrieBattle = await ValkyrieBattle.deploy();
  await valkyrieBattle.deployed();

  console.log(`ValkyrieBattle deployed to ${valkyrieBattle.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
