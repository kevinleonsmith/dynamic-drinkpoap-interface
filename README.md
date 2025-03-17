# dynamic-drinkpoap-interface
 DynamicDrinkPOAP interface
# DynamicDrinkPOAP Interface Documentation

This documentation provides instructions for setting up and using the DynamicDrinkPOAP interface, a React.js Web3 application that interacts with the DynamicDrinkPOAP smart contract to create and update POAPs with drink list entries.

 Features

- **Web3 Integration**: Connect to Ethereum wallets like MetaMask
- **POAP Minting**: Users can mint their own DynamicDrinkPOAP NFTs
- **Drink Collection Management**: Add new drinks with images and descriptions
- **IPFS Integration**: Automatically uploads images and metadata to IPFS
- **Dynamic Updates**: Contract owner can update all POAPs with new drink entries
- **Responsive Design**: Works on desktop and mobile devices

 Getting Started

 Prerequisites

- Node.js (v14+)
- npm or yarn
- MetaMask or compatible Ethereum wallet
- Infura account for IPFS access
- The DynamicDrinkPOAP contract deployed to an Ethereum network

 Installation

1. Clone the repository
```
git clone https://github.com/yourusername/dynamic-drinkpoap-interface.git
cd dynamic-drinkpoap-interface
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file using the provided `.env.example` template
```
cp .env.example .env
```

4. Edit the `.env` file with your Infura project credentials and contract address
```
REACT_APP_INFURA_PROJECT_ID=your_infura_project_id
REACT_APP_INFURA_PROJECT_SECRET=your_infura_project_secret
REACT_APP_CONTRACT_ADDRESS=your_contract_address
```

5. Start the development server
```
npm start
```

 Usage

 For Regular Users

1. **Connect Wallet**: Click the "Connect Wallet" button to link your Ethereum wallet
2. **View Drinks**: Browse the existing drink collection
3. **Mint POAP**: Click "Mint POAP" to receive your DynamicDrinkPOAP NFT
4. The POAP will automatically update as new drinks are added to the collection

 For Contract Owner

1. **Add New Drinks**: Fill out the form with drink name, description, and image
2. **Update POAPs**: Enter token IDs to update and click "Update Selected POAPs"
3. **Monitor IPFS Status**: View the current IPFS metadata URL

 Architecture

 Components

- **React Frontend**: User interface built with React.js
- **Ethers.js**: Library for interacting with the Ethereum blockchain
- **IPFS HTTP Client**: Library for uploading and retrieving content from IPFS

 Data Flow

1. User adds a new drink with image and details
2. Image is uploaded to IPFS
3. Complete drink list metadata is assembled and uploaded to IPFS
4. IPFS URL is used for minting new POAPs or updating existing ones
5. Smart contract stores the IPFS URL reference for each token

 Metadata Structure

```json
{
  "name": "DynamicDrinkPOAP 2025",
  "description": "A dynamic proof of attendance token that updates with new drink entries.",
  "image": "ipfs://YOUR_MAIN_IMAGE_CID",
  "external_url": "https://drinkpoap.example.com",
  "attributes": [
    {
      "trait_type": "Event",
      "value": "DynamicDrinkPOAP"
    },
    {
      "trait_type": "Year",
      "value": "2025"
    },
    {
      "display_type": "date", 
      "trait_type": "Last Updated",
      "value": 1742342400
    }
  ],
  "drinks": [
    {
      "id": "1",
      "name": "Mojito",
      "description": "Classic rum cocktail with lime and mint",
      "imageUrl": "ipfs://QmXYZ...",
      "addedAt": "2025-03-16T12:00:00Z"
    },
    ...
  ]
}
```

 Smart Contract Integration

The interface interacts with two main functions in the DynamicDrinkPOAP contract:

1. `mintPOAP(string memory tokenURI)`: For users to mint their own POAPs
2. `updatePOAP(uint256 tokenId, string memory newTokenURI)`: For the contract owner to update existing POAPs

 Best Practices

- **IPFS Storage**: All images and metadata should be stored on IPFS for decentralization
- **Metadata Updates**: When adding new drinks, update the entire metadata structure
- **Gas Optimization**: Batch update tokens when possible to save on gas costs
- **Local Storage**: Maintain a local copy of the drink list in localStorage for performance

 Troubleshooting

- **MetaMask Connection Issues**: Ensure you're on the correct network
- **IPFS Upload Failures**: Check your Infura credentials and API limits
- **Transaction Errors**: Verify you have sufficient ETH for gas fees
- **Image Display Problems**: IPFS gateway may be slow, images will appear when loaded

 License

This project is licensed under the MIT License - see the LICENSE file for details.

 Author: Kevin Leon Smith, 2025
