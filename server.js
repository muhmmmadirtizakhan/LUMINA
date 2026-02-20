// Lumina Chat Server - Using Gemini 2.5 Flash
require('dotenv').config(); // <-- Load .env first
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Gemini API configuration from .env
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Working model name
const MODEL_NAME = "gemini-2.5-flash";

// Initialize model
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index1.html'));
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }

        console.log(`\n📨 User: ${message}`);
        console.log(`🤖 Using: ${MODEL_NAME}`);

        // Build context from history
        let prompt = message;
        if (history.length > 0) {
            const context = history.map(h => 
                `User: ${h.user}\nAssistant: ${h.bot}`
            ).join('\n\n');
            prompt = `Previous conversation:\n${context}\n\nNew question: ${message}\n\nProvide a well-formatted response with markdown.`;
        }

        // Generate response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`✅ Response: ${text.substring(0, 100)}...`);

        res.json({ 
            response: text,
            model: MODEL_NAME,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ API Error:', error);
        res.status(500).json({ 
            response: `**Error:** ${error.message}\n\nPlease try again.`,
            error: true
        });
    }
});

// Test endpoint
app.get('/api/test', async (req, res) => {
    try {
        const result = await model.generateContent('Say "Lumina is working perfectly!" in a fancy way with markdown formatting.');
        const response = await result.response;
        const text = response.text();
        
        res.json({ 
            status: '✅ Working', 
            model: MODEL_NAME,
            response: text 
        });
    } catch (error) {
        res.json({ 
            status: '❌ Error', 
            error: error.message 
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        model: MODEL_NAME,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log("=================================");
    console.log("🚀 Lumina Server LIVE");
    console.log(`🌍 Running on port ${PORT}`);
    console.log("=================================");
});