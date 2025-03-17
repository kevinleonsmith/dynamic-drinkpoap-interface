import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';
import './App.css';

// Configure IPFS client
// Note: In a production environment, you should use environment variables
const projectId = 'YOUR_INFURA_PROJECT_ID';
const projectSecret = 'YOUR_INFURA_PROJECT_SECRET';
const authorization = 'Basic ' + btoa(projectId + ':' + projectSecret);

const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization
  }
});

// Contract ABI - This should be generated from your Solidity contract
const contractABI = [
  "function mintPOAP(string memory tokenURI) public",
  "function updatePOAP(uint256 tokenId, string memory newTokenURI) public",
  "function hasClaimed(address user) public view returns (bool)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "event POAPMinted(address indexed user, uint256 tokenId, string tokenURI)",
  "event POAPUpdated(uint256 tokenId, string newTokenURI)"
];

// Contract address - Update with your deployed contract address
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

function App() {
  // State variables
  const [account, setAccount] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [contract, setContract] = useState(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [userTokenId, setUserTokenId] = useState(null);
  const [drinkList, setDrinkList] = useState([]);
  const [newDrink, setNewDrink] = useState({ name: '', description: '', image: null });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [ipfsMetadataUrl, setIpfsMetadataUrl] = useState('');
  const [tokensToUpdate, setTokensToUpdate] = useState([]);
  
  // Connect to wallet and set up contract instance
  const connectWallet = async () => {
    try {
      setLoading(true);
      setStatus('Connecting to wallet...');
      
      // Request account access
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        
        // Create contract instance
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        setContract(contractInstance);
        
        // Check if user has already claimed a POAP
        const claimed = await contractInstance.hasClaimed(address);
        setHasClaimed(claimed);
        
        // Check if user is contract owner
        const owner = await contractInstance.owner();
        setIsOwner(owner.toLowerCase() === address.toLowerCase());
        
        setStatus('Connected to wallet!');
        
        // Load current drink list from IPFS if available
        await loadDrinkList();
      } else {
        setStatus('Please install MetaMask or another Ethereum wallet');
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Load drink list from IPFS if available
  const loadDrinkList = async () => {
    try {
      // For demonstration, we'll use localStorage to persist the drink list
      // In production, you'd want to fetch this from IPFS or a database
      const savedDrinks = localStorage.getItem('drinkList');
      if (savedDrinks) {
        setDrinkList(JSON.parse(savedDrinks));
      }
      
      // Additionally, fetch metadata URL if user has claimed
      if (hasClaimed && contract) {
        // In a real implementation, you'd need to query events to find the user's token ID
        // For simplicity, we're assuming the token ID would be available
        // This is a placeholder and would need to be implemented properly
      }
    } catch (error) {
      console.error("Error loading drink list:", error);
      setStatus(`Error loading drinks: ${error.message}`);
    }
  };
  
  // Upload image to IPFS
  const uploadImageToIPFS = async (file) => {
    try {
      const added = await ipfs.add(file);
      return `ipfs://${added.path}`;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };
  
  // Handle image selection
  const handleImageChange = (e) => {
    setNewDrink({
      ...newDrink,
      image: e.target.files[0]
    });
  };
  
  // Handle input changes for new drink form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDrink({
      ...newDrink,
      [name]: value
    });
  };
  
  // Add new drink to the list
  const addDrink = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatus('Adding new drink...');
      
      // Validate input
      if (!newDrink.name || !newDrink.description || !newDrink.image) {
        setStatus('Please fill in all fields');
        setLoading(false);
        return;
      }
      
      // Upload image to IPFS
      const imageUrl = await uploadImageToIPFS(newDrink.image);
      
      // Create new drink object
      const drinkItem = {
        id: Date.now().toString(),
        name: newDrink.name,
        description: newDrink.description,
        imageUrl: imageUrl,
        addedAt: new Date().toISOString()
      };
      
      // Add to drink list
      const updatedDrinks = [...drinkList, drinkItem];
      setDrinkList(updatedDrinks);
      
      // Save to localStorage for persistence
      localStorage.setItem('drinkList', JSON.stringify(updatedDrinks));
      
      // Clear form
      setNewDrink({ name: '', description: '', image: null });
      document.getElementById('image-upload').value = '';
      
      // Update metadata on IPFS
      await updateMetadataOnIPFS(updatedDrinks);
      
      setStatus('Drink added successfully!');
    } catch (error) {
      console.error("Error adding drink:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Update metadata on IPFS
  const updateMetadataOnIPFS = async (drinks) => {
    try {
      setStatus('Updating metadata on IPFS...');
      
      // Create metadata JSON
      const metadata = {
        name: "DynamicDrinkPOAP 2025",
        description: "A dynamic proof of attendance token that updates with new drink entries.",
        image: "ipfs://YOUR_MAIN_IMAGE_CID", // Replace with your main POAP image
        external_url: "https://drinkpoap.example.com",
        attributes: [
          {
            trait_type: "Event",
            value: "DynamicDrinkPOAP"
          },
          {
            trait_type: "Year",
            value: "2025"
          },
          {
            display_type: "date", 
            trait_type: "Last Updated",
            value: Math.floor(Date.now() / 1000)
          }
        ],
        drinks: drinks.map(drink => ({
          id: drink.id,
          name: drink.name,
          description: drink.description,
          imageUrl: drink.imageUrl,
          addedAt: drink.addedAt
        }))
      };
      
      // Upload metadata to IPFS
      const { path } = await ipfs.add(JSON.stringify(metadata));
      const metadataUrl = `ipfs://${path}`;
      setIpfsMetadataUrl(metadataUrl);
      
      setStatus(`Metadata updated on IPFS: ${metadataUrl}`);
      return metadataUrl;
    } catch (error) {
      console.error("Error updating metadata:", error);
      setStatus(`Error updating metadata: ${error.message}`);
      throw error;
    }
  };
  
  // Mint new POAP
  const mintPOAP = async () => {
    try {
      setLoading(true);
      setStatus('Minting your POAP...');
      
      // Make sure metadata is available
      if (!ipfsMetadataUrl) {
        const metadataUrl = await updateMetadataOnIPFS(drinkList);
        setIpfsMetadataUrl(metadataUrl);
      }
      
      // Call contract's mintPOAP function
      const tx = await contract.mintPOAP(ipfsMetadataUrl);
      setStatus('Transaction submitted, waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Find the minted token ID from the event
      const event = receipt.events.find(event => event.event === 'POAPMinted');
      if (event) {
        const tokenId = event.args.tokenId.toNumber();
        setUserTokenId(tokenId);
        setHasClaimed(true);
        setStatus(`Success! Your POAP has been minted with token ID: ${tokenId}`);
      } else {
        setStatus('POAP minted, but could not find token ID in events');
      }
    } catch (error) {
      console.error("Error minting POAP:", error);
      setStatus(`Error minting POAP: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Update existing POAPs with new metadata
  const updateExistingPOAPs = async () => {
    if (!isOwner || !contract) {
      setStatus('Only the contract owner can update existing POAPs');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('Updating existing POAPs...');
      
      // Make sure metadata is available and updated
      const metadataUrl = await updateMetadataOnIPFS(drinkList);
      
      // Update each token in the tokensToUpdate array
      for (const tokenId of tokensToUpdate) {
        const tx = await contract.updatePOAP(tokenId, metadataUrl);
        await tx.wait();
      }
      
      setStatus(`Successfully updated ${tokensToUpdate.length} POAPs with new metadata`);
      setTokensToUpdate([]);
    } catch (error) {
      console.error("Error updating POAPs:", error);
      setStatus(`Error updating POAPs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle token ID input for updates
  const handleTokenIdInput = (e) => {
    const value = e.target.value.trim();
    if (value) {
      const tokenIds = value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      setTokensToUpdate(tokenIds);
    } else {
      setTokensToUpdate([]);
    }
  };
  
  // Connect wallet on component mount
  useEffect(() => {
    connectWallet();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
        connectWallet(); // Reconnect with new account
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);
  
  return (
    <div className="app-container">
      <header>
        <h1>DynamicDrinkPOAP Manager</h1>
        <div className="wallet-info">
          {account ? (
            <p>Connected: {account.substring(0, 6)}...{account.substring(38)}</p>
          ) : (
            <button onClick={connectWallet} disabled={loading}>Connect Wallet</button>
          )}
          {isOwner && <span className="owner-badge">Owner</span>}
        </div>
      </header>
      
      <main>
        <section className="status-section">
          <div className="status-message">{status}</div>
          {loading && <div className="loader"></div>}
        </section>
        
        <section className="claim-section">
          {account && !hasClaimed ? (
            <div className="mint-container">
              <h2>Claim Your DynamicDrinkPOAP</h2>
              <p>This token will update as new drinks are added to the collection.</p>
              <button 
                onClick={mintPOAP} 
                disabled={loading || !ipfsMetadataUrl}
                className="primary-button"
              >
                Mint POAP
              </button>
              {!ipfsMetadataUrl && drinkList.length === 0 && (
                <p className="info-text">Add at least one drink before minting.</p>
              )}
            </div>
          ) : hasClaimed && (
            <div className="claimed-container">
              <h2>You've claimed your POAP!</h2>
              {userTokenId && <p>Your token ID: {userTokenId}</p>}
              <p>Your token will automatically update as new drinks are added.</p>
            </div>
          )}
        </section>
        
        <section className="drinks-section">
          <h2>Drink Collection</h2>
          
          <form onSubmit={addDrink} className="add-drink-form">
            <h3>Add New Drink</h3>
            <div className="form-group">
              <label htmlFor="name">Drink Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newDrink.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={newDrink.description}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="image-upload">Image:</label>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
            </div>
            
            <button type="submit" disabled={loading} className="primary-button">
              Add Drink
            </button>
          </form>
          
          <div className="drink-list">
            <h3>Current Drinks ({drinkList.length})</h3>
            {drinkList.length === 0 ? (
              <p>No drinks added yet. Add your first drink above!</p>
            ) : (
              <div className="drink-cards">
                {drinkList.map(drink => (
                  <div key={drink.id} className="drink-card">
                    <h4>{drink.name}</h4>
                    <p>{drink.description}</p>
                    <div className="image-placeholder">
                      {drink.imageUrl && (
                        <img 
                          src={drink.imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                          alt={drink.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder-drink.png";
                          }}
                        />
                      )}
                    </div>
                    <p className="drink-date">Added: {new Date(drink.addedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        
        {isOwner && (
          <section className="admin-section">
            <h2>Admin Controls</h2>
            <div className="admin-form">
              <h3>Update Existing POAPs</h3>
              <p>As the contract owner, you can update all minted POAPs with the latest metadata.</p>
              
              <div className="form-group">
                <label htmlFor="token-ids">Token IDs to Update (comma separated):</label>
                <input
                  type="text"
                  id="token-ids"
                  placeholder="e.g., 0, 1, 2"
                  onChange={handleTokenIdInput}
                />
              </div>
              
              <button 
                onClick={updateExistingPOAPs} 
                disabled={loading || tokensToUpdate.length === 0}
                className="admin-button"
              >
                Update Selected POAPs
              </button>
            </div>
            
            <div className="ipfs-info">
              <h3>Current IPFS Metadata URL</h3>
              {ipfsMetadataUrl ? (
                <div>
                  <p className="ipfs-url">{ipfsMetadataUrl}</p>
                  <p>View on IPFS: <a href={ipfsMetadataUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')} target="_blank" rel="noopener noreferrer">Open</a></p>
                </div>
              ) : (
                <p>No metadata uploaded yet</p>
              )}
            </div>
          </section>
        )}
      </main>
      
      <footer>
        <p>&copy; 2025 DynamicDrinkPOAP | Created by Kevin Leon Smith</p>
      </footer>
    </div>
  );
}

export default App;
                
