// server.js - Express server to proxy requests to Digital Pour API
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Digital Pour API credentials
const DIGITAL_POUR_API_KEY = process.env.DIGITAL_POUR_API_KEY;
const DIGITAL_POUR_VENUE_ID = process.env.DIGITAL_POUR_VENUE_ID;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Generate QR code tokens for venue
app.post('/api/generate-qr-token', async (req, res) => {
    try {
        // In production, you would authenticate the admin user here
        
        // Generate a unique token for this QR code
        const token = crypto.randomBytes(16).toString('hex');
        
        // Create a JWT that expires in 24 hours
        const jwt = require('jsonwebtoken');
        const qrToken = jwt.sign(
            { 
                token,
                venue: DIGITAL_POUR_VENUE_ID,
                type: 'beer-nft-mint'
            }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.json({ 
            qrToken,
            qrCodeData: `brewhouse:${qrToken}`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
    } catch (error) {
        console.error('Error generating QR token:', error);
        res.status(500).json({ error: 'Failed to generate QR token' });
    }
});

// Validate QR token and return beer list
app.get('/api/beer-list', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify the JWT token
        const jwt = require('jsonwebtoken');
        let decoded;
        
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        // Check if this is the right type of token
        if (decoded.type !== 'beer-nft-mint') {
            return res.status(403).json({ error: 'Invalid token type' });
        }
        
        // Token is valid, fetch beers from Digital Pour API
        const response = await axios.get(
            `https://api.digitalpour.com/V2/Venues/${DIGITAL_POUR_VENUE_ID}/Beers`,
            {
                headers: {
                    'Authorization': `Bearer ${DIGITAL_POUR_API_KEY}`
                }
            }
        );
        
        // Transform the data to our simplified format
        const beers = response.data.map(item => {
            return {
                beverageName: item.BeverageName,
                producerName: item.ProducerName,
                beerStyle: item.BeverageStyle,
                abv: item.Abv,
                ibu: item.Ibu,
                srm: item.Srm
            };
        });
        
        res.json(beers);
    } catch (error) {
        console.error('Error fetching beer list:', error);
        res.status(500).json({ error: 'Failed to fetch beer list' });
    }
});

// Endpoint for minting NFT (this would typically call a serverless function)
app.post('/api/mint-nft', async (req, res) => {
    try {
        const { address, beer } = req.body;
        
        if (!address || !beer) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        // In a production environment, you might want to:
        // 1. Verify the user has permission to mint (e.g., they paid or checked in)
        // 2. Potentially mint the NFT from a trusted backend wallet
        // 3. Store a record of the minting in a database
        
        // For this demo, we'll just return a success response
        // and assume the frontend is calling the contract directly
        res.json({ 
            success: true, 
            message: 'Mint request received. Please complete the transaction in your wallet.'
        });
    } catch (error) {
        console.error('Error processing mint request:', error);
        res.status(500).json({ error: 'Failed to process mint request' });
    }
});

// Admin QR code generator page
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
