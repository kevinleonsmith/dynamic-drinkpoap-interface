// SPDX-License-Identifier: MIT
// by Kevin Leon Smith 2025
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DrinkPOAP is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    mapping(address => bool) public hasClaimed;

    event POAPMinted(address indexed user, uint256 tokenId, string tokenURI);

    constructor() ERC721("DrinkPOAP", "DPOAP") {}

    function mintPOAP(string memory tokenURI) public {
        require(!hasClaimed[msg.sender], "You have already claimed your POAP");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        hasClaimed[msg.sender] = true;
        emit POAPMinted(msg.sender, tokenId, tokenURI);
    }
}
