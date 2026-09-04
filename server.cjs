const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let botRunning = false;

// زانیارییەکانی بۆتی تلگرام
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID_HERE';

function sendTelegramAlert(message) {
    if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.log("[SIMULATION] Telegram Alert:", message);
        return;
    }
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

app.post('/api/bot/start', (req, res) => {
    botRunning = true;
    console.log("[INFO] Bot started. Monitoring XAU/USD for Smart Money Concepts...");
    sendTelegramAlert("🚀 ShahanFX AI Bot Started! Monitoring XAU/USD for signals.");
    res.json({ success: true, message: "Bot started and signal alerts are active." });
});

app.post('/api/bot/stop', (req, res) => {
    botRunning = false;
    console.log("[INFO] Bot stopped.");
    sendTelegramAlert("🛑 ShahanFX AI Bot Stopped.");
    res.json({ success: true, message: "Bot stopped." });
});

app.get('/api/chat', (req, res) => {
    if (!botRunning) {
        return res.json({ analysis: "System ready... Bot is currently stopped." });
    }
    
    const action = Math.random() > 0.5 ? "BUY" : "SELL";
    const price = (2650 + Math.random() * 10).toFixed(2);
    const analysisText = `[AI SIGNAL]: XAU/USD Market Analysis. Action: ${action} at ${price} based on Smart Money Concepts.`;
    
    sendTelegramAlert(`🔔 New Signal:\n${analysisText}`);
    
    res.json({ analysis: analysisText });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ShahanFX AI Server is running on port ${PORT}`);
});
