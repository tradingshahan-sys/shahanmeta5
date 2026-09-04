// lib/gemini.js
// ============================================================
// SHAHANFX AI — GEMINI ENGINE
// Shared Gemini AI Client
// ============================================================


// ============================================================
// Gemini Configuration
// ============================================================

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";


// ============================================================
// Models
// ============================================================

const DEFAULT_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash"
];


// ============================================================
// Get API Key
// ============================================================

export function getGeminiApiKey() {

  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {

    throw new Error(
      "GEMINI_API_KEY is missing"
    );

  }

  return apiKey;
}


// ============================================================
// Build Gemini URL
// ============================================================

export function buildGeminiUrl(
  model
) {

  const apiKey =
    getGeminiApiKey();

  return (
    `${GEMINI_BASE_URL}/${model}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`
  );

}


// ============================================================
// Create Trading System Prompt
// ============================================================

export function buildTradingPrompt({
  symbol = "XAU/USD",
  interval = "15min",
  message = "",
  marketData = null,
  newsData = null
} = {}) {

  return `
You are SHAHANFX AI PRO.

You are a professional financial market analysis assistant.

Your analysis must be based ONLY on information actually provided
to you.

IMPORTANT RULES:

1. NEVER invent live market prices.
2. NEVER invent economic news.
3. NEVER invent CPI data.
4. NEVER invent NFP data.
5. NEVER invent FOMC decisions.
6. NEVER invent PPI data.
7. NEVER invent GDP data.
8. NEVER claim 100% certainty.
9. NEVER create fake entry prices.
10. NEVER create fake stop-loss or take-profit prices.
11. If live market data is unavailable, clearly say:
   "Live market data is unavailable."
12. If economic data is unavailable, clearly say:
   "Economic data is unavailable."
13. Risk management is more important than prediction.
14. Explain the reasoning behind every market bias.
15. Distinguish FACT from ANALYSIS.
16. Do not claim that news caused a market move unless the data
    actually supports that conclusion.

TRADING FRAMEWORK:

- Market Structure
- Higher High / Higher Low
- Lower High / Lower Low
- BOS
- CHOCH
- Liquidity
- Buy-side Liquidity
- Sell-side Liquidity
- Liquidity Sweep
- Fair Value Gap
- Order Block
- Breaker Block
- Mitigation
- Displacement
- Imbalance
- Premium
- Discount
- Support
- Resistance
- ICT Kill Zones
- London Session
- New York Session
- Candlestick Confirmation
- Risk / Reward

CURRENT SYMBOL:
${symbol}

CURRENT TIMEFRAME:
${interval}

MARKET DATA:
${marketData
  ? JSON.stringify(marketData)
  : "NOT AVAILABLE"}

ECONOMIC / NEWS DATA:
${newsData
  ? JSON.stringify(newsData)
  : "NOT AVAILABLE"}

USER REQUEST:
${message}

RESPONSE STYLE:

Answer clearly and professionally.

When sufficient data exists, structure the analysis like this:

📊 SHAHANFX AI PRO

🥇 Symbol:
⏱ Timeframe:
💰 Current Price:
📰 News:
📊 Actual:
📊 Forecast:
📊 Previous:
⚡ News Impact:

📈 Market Bias:
🏗 Market Structure:
🔥 BOS / CHOCH:
💧 Liquidity:
📦 FVG:
🧱 Order Block:
🕯 Candle Reaction:

🎯 Setup:
📍 Entry:
🛑 Invalidation:
🎯 TP:
⚖️ Risk / Reward:
🧠 Confidence:

IMPORTANT:
If an exact Entry, SL or TP cannot be calculated from the
provided data, write "Not available from current data"
instead of inventing a number.
`;
}


// ============================================================
// Build Gemini Request
// ============================================================

function buildRequestBody({
  prompt,
  image = null,
  temperature = 0.2,
  maxOutputTokens = 5000
}) {

  const parts = [

    {
      text: prompt
    }

  ];


  // ==========================================================
  // IMAGE
  // ==========================================================

  if (image) {

    let mimeType =
      "image/jpeg";

    let base64Data =
      image;


    if (
      typeof image === "string" &&
      image.startsWith("data:")
    ) {

      const match =
        image.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/
        );


      if (match) {

        mimeType =
          match[1];

        base64Data =
          match[2];

      }

    }


    parts.push({

      inlineData: {

        mimeType,

        data:
          base64Data

      }

    });

  }


  return {

    contents: [

      {

        role: "user",

        parts

      }

    ],

    generationConfig: {

      temperature,

      maxOutputTokens

    }

  };

}


// ============================================================
// Extract Text
// ============================================================

export function extractGeminiText(
  data
) {

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map(
        (part) =>
          part?.text || ""
      )
      .join("")
      .trim();


  return text || null;

}


// ============================================================
// Generate Content With One Model
// ============================================================

export async function generateWithGemini(
  model,
  options = {}
) {

  const prompt =
    options.prompt || "";


  if (!prompt) {

    throw new Error(
      "Gemini prompt is required"
    );

  }


  const url =
    buildGeminiUrl(model);


  const body =
    buildRequestBody(options);


  const response =
    await fetch(

      url,

      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify(body)

      }

    );


  const rawText =
    await response.text();


  let data;


  try {

    data =
      JSON.parse(rawText);

  } catch {

    const error =
      new Error(
        "Gemini returned invalid JSON"
      );

    error.status =
      response.status;

    error.provider =
      "Gemini";

    throw error;

  }


  if (!response.ok) {

    const providerError =
      data?.error?.message ||
      `Gemini HTTP ${response.status}`;


    const error =
      new Error(
        providerError
      );


    error.status =
      response.status;

    error.provider =
      "Gemini";

    error.data =
      data;


    throw error;

  }


  const text =
    extractGeminiText(data);


  if (!text) {

    const error =
      new Error(
        "Gemini returned an empty response"
      );


    error.status =
      response.status;

    error.provider =
      "Gemini";


    throw error;

  }


  return {

    text,

    model,

    raw:
      data

  };

}


// ============================================================
// Generate With Automatic Model Fallback
// ============================================================

export async function generateGemini(
  options = {}
) {

  const models =
    Array.isArray(options.models) &&
    options.models.length
      ? options.models
      : DEFAULT_MODELS;


  let lastError =
    null;


  for (
    const model
    of models
  ) {

    try {

      const result =
        await generateWithGemini(
          model,
          options
        );


      return result;


    } catch (error) {

      lastError =
        error;

    }

  }


  const error =
    new Error(
      lastError?.message ||
      "All Gemini models failed"
    );


  error.provider =
    "Gemini";


  error.status =
    lastError?.status ||
    503;


  error.lastError =
    lastError;


  throw error;

}


// ============================================================
// Full Trading Analysis
// ============================================================

export async function analyzeTrading(
  {
    symbol = "XAU/USD",
    interval = "15min",
    message = "",
    marketData = null,
    newsData = null,
    image = null
  } = {}
) {

  const prompt =
    buildTradingPrompt({

      symbol,

      interval,

      message,

      marketData,

      newsData

    });


  return generateGemini({

    prompt,

    image,

    temperature:
      0.2,

    maxOutputTokens:
      5000

  });

}


// ============================================================
// Check Gemini Configuration
// ============================================================

export function checkGemini() {

  try {

    getGeminiApiKey();


    return {

      ok: true,

      provider:
        "Gemini"

    };

  } catch (error) {

    return {

      ok: false,

      provider:
        "Gemini",

      error:
        error.message ||
        "Gemini configuration error"

    };

  }

}


// ============================================================
// Safe Error
// ============================================================

export function getGeminiError(
  error
) {

  return {

    provider:
      error?.provider ||
      "Gemini",

    status:
      error?.status ||
      500,

    message:
      error?.message ||
      "Gemini request failed"

  };

}


// ============================================================
// Export Models
// ============================================================

export {
  DEFAULT_MODELS
};
