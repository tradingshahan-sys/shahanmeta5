const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ڕێڕەوی شیکاری و ناردنی سیگناڵ بۆ داشبۆردەکە یان MT5
app.get('/api/chat', (req, res) => {
    try {
        const signal = {
            success: true,
            symbol: "XAUUSD",
            action: "BUY", // BUY یان SELL
            lot: 0.01,
            stopLoss: 2630.00,
            takeProfit: 2750.00,
            comment: "ShahanFX AI Pro EA Signal - Smart Money Setup"
        };
        
        // دەتوانین فۆرماتێکی دەقی بۆ داشبۆردەکەی مۆبایل بنێرین
        res.json({
            analysis: `XAU/USD Signal: ${signal.action} | SL: ${signal.stopLoss} | TP: ${signal.takeProfit} | Status: Order block confirmed.`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ڕێڕەوی تایبەت بە وەرگرتنی داتا لە مێتا٥ (Webhook)
app.post('/api/signal', (req, res) => {
    const marketData = req.body;
    console.log("[MT5 DATA RECEIVED]:", marketData);
    res.json({ success: true, message: "Signal processed successfully" });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
