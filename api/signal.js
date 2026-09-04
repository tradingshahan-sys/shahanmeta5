export default async function handler(req, res) {
  try {
    // دەتوانین لێرەدا لۆجیکی شیکاری زێڕ (XAU/USD) دابنێین یان لە AI وەرگرین
    const signal = {
      success: true,
      symbol: "XAUUSD",
      action: "BUY", // BUY یان SELL
      lot: 0.01,
      stopLoss: 2630.00,
      takeProfit: 2750.00,
      comment: "ShahanFX AI Pro EA Signal"
    };
    return res.status(200).json(signal);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
