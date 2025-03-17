// index.js - Main application file
import { ethers } from 'ethers';
import QrScanner from 'qr-scanner';
import contractABI from './BrewhouseBeerNFT.json';

const CONTRACT_ADDRESS = '0xYourDeployedContractAddress'; // Deployed Contract Address 
const DIGITAL_POUR_API = 'https://api-proxy.digitalpour.com/brewhouse/sjc/beers'; // BrewHouse Digital Pour API

// DOM Elements
const scanButton = document.getElementById('scan-button');
const connectWalletButton = document.getElementById('connect-wallet');
const beerListContainer = document.getElementById('beer-list');
const statusMessage = document.getElementById('status-message');
const videoElement = document.getElementById('qr-video');

let provider, signer, contract;
let userAddress;
let qrScanner;

// Initialize the application
async function init() {
    setupEventListeners();
    setupQrScanner();
}

function setupEventListeners() {
    connectWalletButton.addEventListener('click', connectWallet);
    scanButton.addEventListener('click', startScan);
}

function setupQrScanner() {
    qrScanner = new QrScanner(
        videoElement,
        result => handleQrScan(result.data),
        { returnDetailedScanResult: true }
    );
}

async function connectWallet() {
    try {
        updateStatus('Connecting wallet...');
        
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            updateStatus('Please install MetaMask to use this application', 'error');
            return;
        }
        
        // Request account access
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
        
        updateStatus(`Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`);
        connectWalletButton.innerText = 'Wallet Connected';
        connectWalletButton.disabled = true;
        scanButton.disabled = false;
    } catch (error) {
        console.error('Error connecting wallet:', error);
        updateStatus('Failed to connect wallet: ' + error.message, 'error');
    }
}

async function startScan() {
    if (!userAddress) {
        updateStatus('Please connect your wallet first', 'warning');
        return;
    }
    
    try {
        await qrScanner.start();
        updateStatus('Scanning QR Code...');
        scanButton.innerText = 'Cancel Scan';
        scanButton.removeEventListener('click', startScan);
        scanButton.addEventListener('click', stopScan);
    } catch (error) {
        console.error('Error starting scanner:', error);
        updateStatus('Failed to start camera: ' + error.message, 'error');
    }
}

function stopScan() {
    qrScanner.stop();
    updateStatus('Scan cancelled');
    scanButton.innerText = 'Scan QR Code';
    scanButton.removeEventListener('click', stopScan);
    scanButton.addEventListener('click', startScan);
}

async function handleQrScan(qrData) {
    stopScan();
    updateStatus('QR Code detected! Fetching beer list...');
    
    try {
        // Validate QR code data (should contain verification token for the venue)
        if (!qrData.startsWith('brewhouse:')) {
            updateStatus('Invalid QR code. Please scan a valid Brewhouse SJC QR code.', 'error');
            return;
        }
        
        const venueToken = qrData.split(':')[1];
        await fetchBeerList(venueToken);
    } catch (error) {
        console.error('Error processing QR scan:', error);
        updateStatus('Failed to process QR code: ' + error.message, 'error');
    }
}

async function fetchBeerList(venueToken) {
    try {
        // In production, you'd verify the token on your backend
        const response = await fetch(DIGITAL_POUR_API, {
            headers: {
                'Authorization': `Bearer ${venueToken}` // Normally you'd pass this to your backend
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch beer list: ${response.status}`);
        }
        
        const beers = await response.json();
        displayBeerList(beers);
    } catch (error) {
        console.error('Error fetching beer list:', error);
        // For demo purposes, let's load some sample data
        loadSampleBeerData();
    }
}

function loadSampleBeerData() {
    // Sample data mimicking Digital Pour's API format
    const sampleBeers = [
        {
            "beverageName": "Hazy Wonder",
            "producerName": "Lagunitas",
            "beerStyle": "Hazy IPA",
            "abv": 6.0,
            "ibu": 55,
            "srm": 6 // We'll use this for color
        },
        {
            "beverageName": "805",
            "producerName": "Firestone Walker",
            "beerStyle": "Blonde Ale",
            "abv": 4.7,
            "ibu": 20,
            "srm": 4
        },
        {
            "beverageName": "Sculpin",
            "producerName": "Ballast Point",
            "beerStyle": "IPA",
            "abv": 7.0,
            "ibu": 70,
            "srm": 8
        }
    ];
    
    displayBeerList(sampleBeers);
}

function displayBeerList(beers) {
    updateStatus('Select your favorite beer to mint as NFT');
    beerListContainer.innerHTML = '';
    
    beers.forEach(beer => {
        const beerCard = document.createElement('div');
        beerCard.className = 'beer-card';
        
        // Convert SRM to hex color
        const color = srmToHex(beer.srm || 5);
        
        beerCard.innerHTML = `
            <h3>${beer.beverageName}</h3>
            <p>${beer.producerName}</p>
            <p>${beer.beerStyle}</p>
            <div class="beer-stats">
                <span>ABV: ${beer.abv}%</span>
                <span>IBU: ${beer.ibu || 'N/A'}</span
