// lib/twelveData.js
// ============================================================
// SHAHANFX AI — TWELVE DATA ENGINE
// Shared Market Data Client
// Provider: Twelve Data
// ============================================================

const TWELVE_DATA_BASE_URL =
  "https://api.twelvedata.com";


// ============================================================
// Get API Key
// ============================================================

function getTwelveDataApiKey() {

  const apiKey =
    process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {

    throw new Error(
      "TWELVE_DATA_API_KEY is missing"
    );

  }

  return apiKey;
}


// ============================================================
// Build URL
// ============================================================

function buildTwelveDataUrl(
  endpoint,
  params = {}
) {

  const apiKey =
    getTwelveDataApiKey();

  const url =
    new URL(
      `${TWELVE_DATA_BASE_URL}/${endpoint}`
    );


  for (
    const [key, value]
    of Object.entries(params)
  ) {

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {

      url.searchParams.set(
        key,
        value
      );

    }

  }


  url.searchParams.set(
    "apikey",
    apiKey
  );


  return url.toString();
}


// ============================================================
// Generic Twelve Data Request
// ============================================================

export async function twelveDataRequest(
  endpoint,
  params = {}
) {

  const url =
    buildTwelveDataUrl(
      endpoint,
      params
    );


  const response =
    await fetch(url);


  const rawText =
    await response.text();


  let data;

  try {

    data =
      JSON.parse(rawText);

  } catch {

    throw new Error(
      "Twelve Data returned invalid JSON"
    );

  }


  // ==========================================================
  // Provider Error
  // ==========================================================

  if (
    !response.ok ||
    data?.status === "error" ||
    data?.code
  ) {

    const providerError =
      data?.message ||
      data?.["Error Message"] ||
      `Twelve Data HTTP ${response.status}`;


    const error =
      new Error(
        providerError
      );


    error.status =
      response.status;


    error.provider =
      "Twelve Data";


    error.data =
      data;


    throw error;

  }


  return data;
}


// ============================================================
// Symbol Normalizer
// ============================================================

export function normalizeSymbol(
  symbol = "XAU/USD"
) {

  const value =
    String(symbol)
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");


  const aliases = {

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


  return (
    aliases[value] ||
    symbol
  );

}


// ============================================================
// Interval Normalizer
// ============================================================

export function normalizeInterval(
  interval = "15min"
) {

  const value =
    String(interval)
      .trim()
      .toLowerCase();


  const aliases = {

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


  return (
    aliases[value] ||
    interval
  );

}


// ============================================================
// Get Time Series
// ============================================================

export async function getTimeSeries(
  symbol = "XAU/USD",
  interval = "15min",
  outputsize = 100
) {

  const normalizedSymbol =
    normalizeSymbol(symbol);


  const normalizedInterval =
    normalizeInterval(interval);


  const data =
    await twelveDataRequest(
      "time_series",
      {

        symbol:
          normalizedSymbol,

        interval:
          normalizedInterval,

        outputsize:
          Math.min(
            Number(outputsize) || 100,
            5000
          ),

        order:
          "ASC"

      }
    );


  return data;

}


// ============================================================
// Normalize Candle
// ============================================================

export function normalizeCandle(
  candle
) {

  if (!candle) {
    return null;
  }


  const open =
    Number(candle.open);


  const high =
    Number(candle.high);


  const low =
    Number(candle.low);


  const close =
    Number(candle.close);


  const volume =
    candle.volume !== undefined
      ? Number(candle.volume)
      : null;


  return {

    datetime:
      candle.datetime ||
      null,

    open,

    high,

    low,

    close,

    volume,

    bullish:
      close > open,

    bearish:
      close < open,

    body:
      Math.abs(close - open),

    range:
      high - low

  };

}


// ============================================================
// Get Normalized Candles
// ============================================================

export async function getCandles(
  symbol = "XAU/USD",
  interval = "15min",
  outputsize = 100
) {

  const data =
    await getTimeSeries(
      symbol,
      interval,
      outputsize
    );


  const values =
    Array.isArray(data?.values)
      ? data.values
      : [];


  return values
    .map(normalizeCandle)
    .filter(Boolean);

}


// ============================================================
// Get Latest Candle
// ============================================================

export async function getLatestCandle(
  symbol = "XAU/USD",
  interval = "15min"
) {

  const candles =
    await getCandles(
      symbol,
      interval,
      2
    );


  if (!candles.length) {
    return null;
  }


  return candles[
    candles.length - 1
  ];

}


// ============================================================
// Get Current Price
// ============================================================

export async function getPrice(
  symbol = "XAU/USD"
) {

  const normalizedSymbol =
    normalizeSymbol(symbol);


  const data =
    await twelveDataRequest(
      "price",
      {
        symbol:
          normalizedSymbol
      }
    );


  const price =
    Number(data?.price);


  if (!
