// SPDX-License-Identifier: MIT
// by Kevin Leon Smith 2025
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DynamicDrinkPOAP is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    mapping(address => bool) public hasClaimed;
    mapping(uint256 => string) private _tokenMetadata;

    event POAPMinted(address indexed user, uint256 tokenId, string tokenURI);
    event POAPUpdated(uint256 tokenId, string newTokenURI);

    constructor() ERC721("DynamicDrinkPOAP", "DDPOAP") {}

    function mintPOAP(string memory tokenURI) public {
        require(!hasClaimed[msg.sender], "You have already claimed your POAP");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenMetadata[tokenId] = tokenURI;

        hasClaimed[msg.sender] = true;
        emit POAPMinted(msg.sender, tokenId, tokenURI);
    }

    function updatePOAP(uint256 tokenId, string memory newTokenURI) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _setTokenURI(tokenId, newTokenURI);
        _tokenMetadata[tokenId] = newTokenURI;

        emit POAPUpdated(tokenId, newTokenURI);
    }
}
