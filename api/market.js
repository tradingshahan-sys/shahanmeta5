// api/market.js
// ============================================================
// SHAHANFX AI — LIVE MARKET ENGINE
// Provider: Twelve Data
// ============================================================

const SYMBOLS = {
  "XAU/USD": "XAU/USD",
  "XAUUSD": "XAU/USD",
  "GOLD": "XAU/USD",

  "EUR/USD": "EUR/USD",
  "EURUSD": "EUR/USD",

  "GBP/USD": "GBP/USD",
  "GBPUSD": "GBP/USD",

  "USD/JPY": "USD/JPY",
  "USDJPY": "USD/JPY",

  "USD/CHF": "USD/CHF",
  "USDCHF": "USD/CHF",

  "AUD/USD": "AUD/USD",
  "AUDUSD": "AUD/USD",

  "USD/CAD": "USD/CAD",
  "USDCAD": "USD/CAD",

  "NZD/USD": "NZD/USD",
  "NZDUSD": "NZD/USD"
};

const INTERVALS = {
  "1m": "1min",
  "1min": "1min",

  "5m": "5min",
  "5min": "5min",

  "15m": "15min",
  "15min": "15min",

  "30m": "30min",
  "30min": "30min",

  "1h": "1h",
  "1hour": "1h",

  "4h": "4h",
  "4hour": "4h",

  "1d": "1day",
  "1day": "1day"
};

function sendError(res, status, error, details = null) {
  return res.status(status).json({
    success: false,
    error,
    ...(details ? { details } : {})
  });
}

export default async function handler(req, res) {

  // ==========================================================
  // CORS
  // ==========================================================

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ==========================================================
  // METHOD
  // ==========================================================

  if (!["GET", "POST"].includes(req.method)) {
    return sendError(
      res,
      405,
      "Only GET and POST methods are allowed"
    );
  }

  // ==========================================================
  // API KEY
  // ==========================================================

  const API_KEY = process.env.TWELVE_DATA_API_KEY;

  if (!API_KEY) {
    return sendError(
      res,
      500,
      "TWELVE_DATA_API_KEY is not configured"
    );
  }

  try {

    // ========================================================
    // INPUT
    // ========================================================

    const body =
      req.method === "POST" && req.body
        ? req.body
        : {};

    const query = req.query || {};

    const requestedSymbol =
      body.symbol ||
      query.symbol ||
      "XAU/USD";

    const requestedInterval =
      body.interval ||
      query.interval ||
      "15min";

    const symbolKey =
      String(requestedSymbol)
        .trim()
        .toUpperCase();

    const intervalKey =
      String(requestedInterval)
        .trim()
        .toLowerCase();

    const symbol =
      SYMBOLS[symbolKey] || "XAU/USD";

    const interval =
      INTERVALS[intervalKey] || "15min";

    // ========================================================
    // TWELVE DATA
    // ========================================================

    const url =
      "https://api.twelvedata.com/time_series" +
      `?symbol=${encodeURIComponent(symbol)}` +
      `&interval=${encodeURIComponent(interval)}` +
      "&outputsize=100" +
      "&format=JSON" +
      `&apikey=${encodeURIComponent(API_KEY)}`;

    const response = await fetch(url);

    const rawText = await response.text();

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      return sendError(
        res,
        502,
        "Invalid response from Twelve Data"
      );
    }

    // ========================================================
    // PROVIDER ERROR
    // ========================================================

    if (!response.ok) {

      return sendError(
        res,
        502,
        "Twelve Data request failed",
        {
          providerStatus: response.status,
          providerMessage:
            data?.message ||
            data?.code ||
            "Unknown provider error"
        }
      );
    }

    if (data?.status === "error") {

      return sendError(
        res,
        502,
        "Twelve Data returned an error",
        {
          providerMessage:
            data?.message || "Unknown provider error",
          providerCode:
            data?.code || null
        }
      );
    }

    // ========================================================
    // CANDLES
    // ========================================================

    if (!Array.isArray(data?.values)) {

      return sendError(
        res,
        502,
        "No market candles received",
        {
          providerMessage:
            data?.message || null
        }
      );
    }

    const candles = data.values
      .map((candle) => ({
        datetime: candle.datetime,

        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),

        volume:
          candle.volume !== undefined
            ? Number(candle.volume)
            : null
      }))
      .filter((candle) =>
        Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close)
      )
      .reverse();

    if (!candles.length) {

      return sendError(
        res,
        502,
        "Market data is empty"
      );
    }

    // ========================================================
    // CURRENT / PREVIOUS CANDLE
    // ========================================================

    const current =
      candles[candles.length - 1];

    const previous =
      candles.length > 1
        ? candles[candles.length - 2]
        : null;

    // ========================================================
    // PRICE
    // ========================================================

    const currentPrice =
      current.close;

    const previousClose =
      previous?.close ?? null;

    let direction = "NEUTRAL";

    if (
      previousClose !== null &&
      currentPrice > previousClose
    ) {
      direction = "BULLISH";
    }

    if (
      previousClose !== null &&
      currentPrice < previousClose
    ) {
      direction = "BEARISH";
    }

    // ========================================================
    // CANDLE CHANGE
    // ========================================================

    let change = null;
    let changePercent = null;

    if (previousClose !== null) {

      change =
        currentPrice - previousClose;

      if (previousClose !== 0) {

        changePercent =
          ((currentPrice - previousClose) /
            previousClose) * 100;
      }
    }

    // ========================================================
    // SIMPLE MARKET STRUCTURE
    // ========================================================

    let structure = "NEUTRAL";

    if (candles.length >= 5) {

      const recent =
        candles.slice(-5);

      const highs =
        recent.map(c => c.high);

      const lows =
        recent.map(c => c.low);

      const higherHigh =
        highs[4] > highs[2];

      const higherLow =
        lows[4] > lows[2];

      const lowerHigh =
        highs[4] < highs[2];

      const lowerLow =
        lows[4] < lows[2];

      if (higherHigh && higherLow) {
        structure = "BULLISH";
      }

      if (lowerHigh && lowerLow) {
        structure = "BEARISH";
      }
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      provider: "Twelve Data",

      symbol,

      interval,

      currentPrice,

      previousClose,

      change,

      changePercent,

      direction,

      structure,

      currentCandle: current,

      previousCandle: previous,

      candles,

      meta: {
        requestedSymbol,
        requestedInterval,
        returnedCandles: candles.length,
        timestamp: new Date().toISOString()
      }

    });

  } catch (error) {

    return sendError(
      res,
      500,
      "Market engine server error",
      error.message || "Unknown error"
    );
  }
}
