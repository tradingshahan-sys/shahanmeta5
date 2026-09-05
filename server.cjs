require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ڕێکخستنی جێمینی
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let botRunning = false;
let autoInterval = null;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8919260750:AAGEk8o2f3raRNxjLyfZ';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1003872701268';

function sendTelegramAlert(message) {
    const data = JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, res => {
        res.on('data', d => process.stdout.write(d));
    });

    req.on('error', error => {
        console.error("Telegram Error:", error);
    });

    req.write(data);
    req.end();
}

// ناردنی شیکاری خودکار لە ڕێگەی جێمینییەوە بۆ تلگرام
async function generateAndSendSignal() {
    if (!botRunning) return;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Analyze XAU/USD using Smart Money Concepts, Order Blocks, and wick analysis. Give a short trading signal with BUY/SELL, SL, and TP.',
        });
        
        const analysisText = `🔔 [XAU/USD AI SIGNAL]:\n${response.text}`;
        console.log(analysisText);
        sendTelegramAlert(analysisText);
    } catch (err) {
        console.error("Gemini Signal Error:", err);
    }
}

// ڕێڕەوی تایبەت بە چات لەگەڵ ڕاوێژی زیرەک لە ڕووکارەوە
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
        });
        
        res.json({ success: true, reply: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch AI response' });
    }
});

app.post('/api/bot/start', (req, res) => {
    if (!botRunning) {
        botRunning = true;
        console.log("[INFO] Bot started with Auto-Interval.");
        sendTelegramAlert("🚀 ShahanFX AI Bot Started! Automatic XAU/USD monitoring is active.");
        autoInterval = setInterval(generateAndSendSignal, 1000 * 60 * 30); 
    }
    res.json({ success: true, message: "Bot started and automatic signals are active." });
});

app.post('/api/bot/stop', (req, res) => {
    botRunning = false;
    if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
    }
    console.log("[INFO] Bot stopped.");
    sendTelegramAlert("🛑 ShahanFX AI Bot Stopped.");
    res.json({ success: true, message: "Bot stopped." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ShahanFX AI Server is running on port ${PORT}`);
});
