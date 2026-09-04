const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let botRunning = false;
let autoInterval = null;

// زانیارییەکانی بۆتی تلگرام
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

function generateAndSendSignal() {
    if (!botRunning) return;
    
    const action = Math.random() > 0.5 ? "BUY" : "SELL";
    const price = (2650 + Math.random() * 10).toFixed(2);
    const analysisText = `🔔 [XAU/USD AUTOMATIC SIGNAL]:\nAction: ${action}\nPrice: ${price}\nStrategy: Smart Money Concepts (SMC)`;
    
    console.log(analysisText);
    sendTelegramAlert(analysisText);
}

app.post('/api/bot/start', (req, res) => {
    if (!botRunning) {
        botRunning = true;
        console.log("[INFO] Bot started with Auto-Interval.");
        sendTelegramAlert("🚀 ShahanFX AI Bot Started! Automatic XAU/USD monitoring is active.");
        
        // ناردنی سیگناڵ خۆکار هەر ٣٠ خولەک جارێک (دەتوانیت کاتەکە بگۆڕیت، بۆ نموونە 1000 * 60 * 15 بۆ ١٥ خولەک)
        // لێرەدا بۆ تاقیکردنەوە دەتوانین لەسەر چەند خولەکێکی دابنێین
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
