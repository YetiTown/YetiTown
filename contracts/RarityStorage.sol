pragma solidity ^0.8.0;

import "./Ownable.sol";


contract RarityStorage is Ownable {

    mapping(uint256 => uint256) public tokenRarity;
    uint256 public rarityCounter = 1; 
 
    function GetRarity(uint256 tokenId) public view returns (uint256) {
        return tokenRarity[tokenId];
    }

    function SetRarity(uint256 rarity) public onlyOwner {
        tokenRarity[rarityCounter] = rarity;
        rarityCounter += 1;
    }

    function EditRarity(uint256 tokenId, uint256 rarity) public onlyOwner {
        tokenRarity[tokenId] = rarity;
    }

    function SetRarities(uint256[] memory rarities) public onlyOwner {
        uint len = 0;
        require(len < rarities.length);
        while (len < rarities.length)  {
            tokenRarity[rarityCounter] = rarities[len];
            rarityCounter++;    
            len++;
        }
    }

    function RaritiesCounter() public view returns (uint256) {
        return rarityCounter;
    }
}