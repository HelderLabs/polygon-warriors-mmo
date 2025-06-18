// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WarriorNFT is ERC721, Ownable {
    uint256 private _tokenIds;

    struct Warrior {
        string name;
        uint256 level;
        uint256 experience;
        uint256 strength;
        uint256 defense;
        uint256 speed;
        uint256 mana;
        string class; // "warrior", "mage", "archer"
        uint256 lastBattle;
        bool isActive;
    }

    mapping(uint256 => Warrior) public warriors;
    mapping(address => uint256[]) public playerWarriors;
    
    string private _baseTokenURI;
    uint256 public mintPrice = 0.01 ether; // Price in MATIC
    uint256 public maxSupply = 10000;

    event WarriorMinted(address indexed player, uint256 indexed tokenId, string class);
    event WarriorLevelUp(uint256 indexed tokenId, uint256 newLevel);

    constructor(string memory baseURI) ERC721("Polygon Warriors", "PWAR") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    function mintWarrior(string memory name, string memory class) public payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIds < maxSupply, "Max supply reached");
        require(bytes(name).length > 0 && bytes(name).length <= 20, "Invalid name length");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        // Generate random stats based on class
        (uint256 str, uint256 def, uint256 spd, uint256 mana) = _generateStats(class, newTokenId);

        warriors[newTokenId] = Warrior({
            name: name,
            level: 1,
            experience: 0,
            strength: str,
            defense: def,
            speed: spd,
            mana: mana,
            class: class,
            lastBattle: block.timestamp,
            isActive: true
        });

        playerWarriors[msg.sender].push(newTokenId);
        _mint(msg.sender, newTokenId);

        emit WarriorMinted(msg.sender, newTokenId, class);
    }

    function _generateStats(string memory class, uint256 seed) private pure returns (uint256, uint256, uint256, uint256) {
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(class, seed)));
        
        if (keccak256(bytes(class)) == keccak256(bytes("warrior"))) {
            return (
                70 + (randomSeed % 31), // strength: 70-100
                60 + ((randomSeed >> 8) % 31), // defense: 60-90
                40 + ((randomSeed >> 16) % 21), // speed: 40-60
                30 + ((randomSeed >> 24) % 21)  // mana: 30-50
            );
        } else if (keccak256(bytes(class)) == keccak256(bytes("mage"))) {
            return (
                30 + (randomSeed % 21), // strength: 30-50
                40 + ((randomSeed >> 8) % 21), // defense: 40-60
                50 + ((randomSeed >> 16) % 31), // speed: 50-80
                80 + ((randomSeed >> 24) % 21)  // mana: 80-100
            );
        } else { // archer
            return (
                50 + (randomSeed % 31), // strength: 50-80
                45 + ((randomSeed >> 8) % 26), // defense: 45-70
                70 + ((randomSeed >> 16) % 31), // speed: 70-100
                50 + ((randomSeed >> 24) % 21)  // mana: 50-70
            );
        }
    }

    function levelUpWarrior(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        Warrior storage warrior = warriors[tokenId];
        require(warrior.experience >= warrior.level * 100, "Insufficient experience");
        
        warrior.level++;
        warrior.experience = 0;
        
        // Increase stats on level up
        warrior.strength += 5;
        warrior.defense += 3;
        warrior.speed += 2;
        warrior.mana += 4;

        emit WarriorLevelUp(tokenId, warrior.level);
    }

    function getPlayerWarriors(address player) public view returns (uint256[] memory) {
        return playerWarriors[player];
    }

    function getWarrior(uint256 tokenId) public view returns (Warrior memory) {
        return warriors[tokenId];
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
