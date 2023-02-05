# ValkyrieBattle

This project is the solidity version of https://github.com/LaneTwo/ValkyrieBattle.
Also add support for more players(3 players for now) and add radom obstacle for user plane layout.

# Game basic rule
* Each player can place planes(below shape with +) on a 10 * 10 grid board
```
    OO+OO
    +++++
    OO+OO
    O+++O
```
* They need to place 3 planes and rotate the plane.
* The planes can't overlap and out of board boarder.
* There will be 3 random obstacles cell, they can place plane.
* After game start, player will attack others with coordinate in turn.
* The player under attack need to report back whether it hit the plane, miss or hit the plane nose(crash)
* Player lose the game when all three planes crashed

# Key logic
* The player's plane layout will be kept on local when game in progress, we will leverage the commit-reveal method to do this, only game layout hash(hash with salt) will be put onchain.
* When game end normally(only one player's planes are not all crashed), the winner need to reveal his plane layout to prove he/she doesn't cheat on reporting attack result. 
* When user find other player cheating on reporting attack result, they can challenge the player to reveal the layout, the player be challenged need to reveal the layout and salt
* Smart contract will verify the game layout hash with the revealed layout and salt, and also check whether each step result is reported correctly. If cheating verify success, then the player be challenged win the game, otherwise other players win.

#Random Obstacle
* Some randomness is added to game, when player join game they need to choose a random salt(uint256) and send the salt hash. when all players joined, the random seed for all players will be generated:
  obstacleSeed = keccak256(allPlayers' salt hash array, block timestamp)
* Then each player need to use this seed to generate the random obstacle place(the logic is  on frontend):
  total position: 100
  obstacle 1 pos seed: keccak256(salt, obstacleSeed)
  obstacle 1 pos: keccak256(salt, obstacleSeed) % 100
  obstacle 2 pos seed: keccak256(salt, obstacleSeed, obstacle 1 pos seed)
  obstacle 2 pos: obstacle 2 pos seed % 99
  obstacle 3 pos seed: keccak256(salt, obstacleSeed, obstacle 2 pos seed)
  obstacle 3 pos: obstacle 3 pos seed % 98
This way other player won't be able to know what's the obstacle positions because they don't know other's original salt.
* And when player reveal their game layout, they also need to reveal the obstacle salt to let smart contract verify they didn't cheat on obstacle layout.
* There are very slightly chance for the last player who join the same to use smart contract to choose proper salt hash and join game on proper timestamp to generate a obstacleSeed, which can generate him obstacle on the position will never be used(0,0), (0,9), (9,0), (9,9)
Considering the possibility is quite low and the App is not finicial critical, the current random way should be acceptable.

# Code structure

# TODO

* Timeout for interaction, player may not reponding on any step, we need to handle timeout properly to let other players can continue/end the game properly.
* More unit test
* Upgradable contract
* GAS optimization
* Necessary comment

# How to build & test
Try running some of the following tasks:

```shell
npm install #install package
npx hardhat compile # Compile contract
npx hardhat test # Run unit test
REPORT_GAS=true npx hardhat test
npx hardhat run scripts/deploy.ts # need to config network/private key in hardhat.config.ts
```




