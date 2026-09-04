// api/chat.js
// ============================================================
// SHAHANFX AI — Main AI Trading Assistant
// ============================================================

export default async function handler(req, res) {
  // ----------------------------------------------------------
  // CORS
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // Only POST
  // ----------------------------------------------------------
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST method is allowed"
    });
  }

  // ----------------------------------------------------------
  // Environment variables
  // ----------------------------------------------------------
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY is not configured"
    });
  }

  // ----------------------------------------------------------
  // Read request
  // ----------------------------------------------------------
  try {
    const {
      message = "",
      symbol = "XAU/USD",
      interval = "15min",
      image = null
    } = req.body || {};

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        error: "Message or image is required"
      });
    }

    // --------------------------------------------------------
    // Basic trading context
    // --------------------------------------------------------
    const tradingContext = `
You are ShahanFX AI Pro.

Your job is to analyze financial markets professionally.

IMPORTANT RULES:

1. Never invent live market prices.
2. Never invent economic news.
3. Never invent CPI, NFP, FOMC, PPI or GDP data.
4. Never claim 100% certainty.
5. If live data is unavailable, clearly say so.
6. Do not give fake entry prices.
7. Do not calculate lot size without balance and risk percentage.
8. Use ICT and SMC concepts when relevant.
9. Explain the reasoning behind the analysis.
10. Risk management is more important than prediction.

Supported concepts:

- Market Structure
- BOS
- CHOCH
- Liquidity
- Liquidity Sweep
- Fair Value Gap
- Order Block
- Breaker Block
- Premium / Discount
- Displacement
- Imbalance
- Kill Zones
- London Session
- New York Session
- Support / Resistance
- Candlestick confirmation

Current symbol:
${symbol}

Current timeframe:
${interval}

User message:
${message}
`;

    // --------------------------------------------------------
    // Gemini models
    // --------------------------------------------------------
    const models = [
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash"
    ];

    let lastError = null;

    for (const model of models) {
      try {
        // ----------------------------------------------------
        // Build Gemini content
        // ----------------------------------------------------
        const parts = [
          {
            text: tradingContext
          }
        ];

        // ----------------------------------------------------
        // Optional image
        // ----------------------------------------------------
        if (image) {
          let mimeType = "image/jpeg";
          let base64Data = image;

          if (image.startsWith("data:")) {
            const match = image.match(
              /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/
            );

            if (match) {
              mimeType = match[1];
              base64Data = match[2];
            }
          }

          parts.push({
            inlineData: {
              mimeType,
              data: base64Data
            }
          });
        }

        // ----------------------------------------------------
        // Gemini request
        // ----------------------------------------------------
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts
                }
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 5000
              }
            })
          }
        );

        const data = await response.json();

        // ----------------------------------------------------
        // Gemini error
        // ----------------------------------------------------
        if (!response.ok) {
          lastError =
            data?.error?.message ||
            `Gemini HTTP ${response.status}`;

          continue;
        }

        // ----------------------------------------------------
        // Extract answer
        // ----------------------------------------------------
        const answer =
          data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();

        if (!answer) {
          lastError = "Gemini returned an empty response";
          continue;
        }

        // ----------------------------------------------------
        // Success
        // ----------------------------------------------------
        return res.status(200).json({
          success: true,
          answer,
          model,
          symbol,
          interval,
          hasImage: Boolean(image)
        });

      } catch (error) {
        lastError = error.message || "Unknown Gemini error";
      }
    }

    // --------------------------------------------------------
    // All models failed
    // --------------------------------------------------------
    return res.status(503).json({
      success: false,
      error: "All Gemini models failed",
      details: lastError
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error"
    });
  }
}
