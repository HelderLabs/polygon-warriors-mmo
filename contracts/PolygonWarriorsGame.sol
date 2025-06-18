// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./WarriorToken.sol";
import "./WarriorNFT.sol";

contract PolygonWarriorsGame is Ownable, ReentrancyGuard {
    WarriorToken public gameToken;
    WarriorNFT public warriorNFT;

    struct Battle {
        uint256 warrior1;
        uint256 warrior2;
        address player1;
        address player2;
        uint256 winner;
        uint256 timestamp;
        bool completed;
    }

    struct Leaderboard {
        address player;
        uint256 wins;
        uint256 losses;
        uint256 totalBattles;
        uint256 rating;
    }

    mapping(uint256 => Battle) public battles;
    mapping(address => Leaderboard) public leaderboard;
    mapping(address => uint256) public lastBattleTime;
    
    uint256 public battleCounter;
    uint256 public battleCooldown = 5 minutes;
    uint256 public winnerReward = 100 * 10**18; // 100 WGOLD
    uint256 public participationReward = 25 * 10**18; // 25 WGOLD

    event BattleStarted(uint256 indexed battleId, address player1, address player2);
    event BattleCompleted(uint256 indexed battleId, address winner, uint256 winnerTokenId);
    event RewardDistributed(address indexed player, uint256 amount);

    constructor(address _gameToken, address _warriorNFT) Ownable(msg.sender) {
        gameToken = WarriorToken(_gameToken);
        warriorNFT = WarriorNFT(_warriorNFT);
    }

    function startBattle(uint256 myWarriorId, uint256 opponentWarriorId) public nonReentrant {
        require(warriorNFT.ownerOf(myWarriorId) == msg.sender, "Not your warrior");
        require(warriorNFT.ownerOf(opponentWarriorId) != msg.sender, "Cannot battle yourself");
        require(block.timestamp >= lastBattleTime[msg.sender] + battleCooldown, "Battle cooldown active");
        
        address opponent = warriorNFT.ownerOf(opponentWarriorId);
        require(block.timestamp >= lastBattleTime[opponent] + battleCooldown, "Opponent in cooldown");

        battleCounter++;
        battles[battleCounter] = Battle({
            warrior1: myWarriorId,
            warrior2: opponentWarriorId,
            player1: msg.sender,
            player2: opponent,
            winner: 0,
            timestamp: block.timestamp,
            completed: false
        });

        lastBattleTime[msg.sender] = block.timestamp;
        lastBattleTime[opponent] = block.timestamp;

        emit BattleStarted(battleCounter, msg.sender, opponent);
        
        // Auto-resolve battle (in a real game, this might be done off-chain)
        _resolveBattle(battleCounter);
    }

    function _resolveBattle(uint256 battleId) private {
        Battle storage battle = battles[battleId];
        require(!battle.completed, "Battle already completed");

        WarriorNFT.Warrior memory warrior1 = warriorNFT.getWarrior(battle.warrior1);
        WarriorNFT.Warrior memory warrior2 = warriorNFT.getWarrior(battle.warrior2);

        // Simple battle calculation (can be made more complex)
        uint256 power1 = warrior1.strength + warrior1.defense + warrior1.speed + warrior1.mana;
        uint256 power2 = warrior2.strength + warrior2.defense + warrior2.speed + warrior2.mana;
        
        // Add some randomness
        uint256 randomFactor = uint256(keccak256(abi.encodePacked(block.timestamp, battle.warrior1, battle.warrior2))) % 100;
        
        address winner;
        uint256 winnerTokenId;
        
        if (power1 + randomFactor > power2) {
            winner = battle.player1;
            winnerTokenId = battle.warrior1;
        } else {
            winner = battle.player2;
            winnerTokenId = battle.warrior2;
        }

        battle.winner = winnerTokenId;
        battle.completed = true;

        // Update leaderboard
        _updateLeaderboard(battle.player1, battle.player2, winner);

        // Distribute rewards
        gameToken.mint(winner, winnerReward);
        address loser = winner == battle.player1 ? battle.player2 : battle.player1;
        gameToken.mint(loser, participationReward);

        emit BattleCompleted(battleId, winner, winnerTokenId);
        emit RewardDistributed(winner, winnerReward);
        emit RewardDistributed(loser, participationReward);
    }

    function _updateLeaderboard(address player1, address player2, address winner) private {
        leaderboard[player1].totalBattles++;
        leaderboard[player2].totalBattles++;

        if (winner == player1) {
            leaderboard[player1].wins++;
            leaderboard[player2].losses++;
            leaderboard[player1].rating += 10;
            if (leaderboard[player2].rating >= 5) {
                leaderboard[player2].rating -= 5;
            }
        } else {
            leaderboard[player2].wins++;
            leaderboard[player1].losses++;
            leaderboard[player2].rating += 10;
            if (leaderboard[player1].rating >= 5) {
                leaderboard[player1].rating -= 5;
            }
        }
    }

    function getPlayerStats(address player) public view returns (Leaderboard memory) {
        return leaderboard[player];
    }

    function getBattle(uint256 battleId) public view returns (Battle memory) {
        return battles[battleId];
    }

    function claimDailyReward() public nonReentrant {
        // Players can claim daily rewards (implement your own logic)
        uint256 dailyReward = 50 * 10**18; // 50 WGOLD
        gameToken.mint(msg.sender, dailyReward);
        emit RewardDistributed(msg.sender, dailyReward);
    }

    // Admin functions
    function setBattleCooldown(uint256 newCooldown) public onlyOwner {
        battleCooldown = newCooldown;
    }

    function setRewards(uint256 winner, uint256 participation) public onlyOwner {
        winnerReward = winner;
        participationReward = participation;
    }

    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
