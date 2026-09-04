// api/chat.js
// ============================================================
// SHAHANFX AI PRO — MASTER AI ENGINE
// Market + Economic Data + Gemini
// ============================================================

import {
  getMarketSnapshot
} from "../lib/twelveData.js";

import {
  getEconomicCalendar
} from "../lib/fmp.js";

import {
  analyzeTrading,
  getGeminiError
} from "../lib/gemini.js";

import {
  getBaghdadDate
} from "../lib/dates.js";

import {
  getRequestBody,
  safeString
} from "../lib/helpers.js";


// ============================================================
// CORS
// ============================================================

function setCors(res) {

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

}


// ============================================================
// Find Economic Event
// ============================================================

function findEvents(
  events,
  keywords
) {

  if (
    !Array.isArray(events)
  ) {

    return [];

  }


  return events.filter(
    (event) => {

      const name =
        String(
          event?.event || ""
        ).toLowerCase();


      return keywords.some(
        (keyword) =>
          name.includes(
            keyword
          )
      );

    }
  );

}


// ============================================================
// US Economic Events
// ============================================================

function getImportantUSData(
  events
) {

  const usEvents =
    Array.isArray(events)
      ? events.filter(
          (event) => {

            const country =
              String(
                event?.country || ""
              )
              .trim()
              .toUpperCase();


            const currency =
              String(
                event?.currency || ""
              )
              .trim()
              .toUpperCase();


            return (
              country === "US" ||
              country === "USA" ||
              country === "UNITED STATES" ||
              currency === "USD"
            );

          }
        )
      : [];


  return {

    cpi:
      findEvents(
        usEvents,
        [
          "consumer price index",
          "cpi"
        ]
      ),

    nfp:
      findEvents(
        usEvents,
        [
          "nonfarm payroll",
          "non-farm payroll",
          "nonfarm employment",
          "nfp"
        ]
      ),

    fomc:
      findEvents(
        usEvents,
        [
          "fomc",
          "federal funds rate",
          "fed interest rate",
          "interest rate decision"
        ]
      ),

    ppi:
      findEvents(
        usEvents,
        [
          "producer price index",
          "ppi"
        ]
      ),

    gdp:
      findEvents(
        usEvents,
        [
          "gross domestic product",
          "gdp"
        ]
      )

  };

}


// ============================================================
// Market Context
// ============================================================

function buildMarketContext(
  market
) {

  if (!market) {

    return {

      available: false,

      message:
        "Live market data is unavailable."

    };

  }


  return {

    available: true,

    symbol:
      market.symbol,

    interval:
      market.interval,

    price:
      market.price,

    change:
      market.change,

    changePercent:
      market.changePercent,

    direction:
      market.direction,

    currentCandle:
      market.currentCandle,

    previousCandle:
      market.previousCandle,

    candles:
      market.candles

  };

}


// ============================================================
// Economic Context
// ============================================================

function buildEconomicContext(
  data
) {

  if (
    !data
  ) {

    return {

      available: false,

      message:
        "Economic data is unavailable."

    };

  }


  return {

    available: true,

    cpi:
      data.cpi || [],

    nfp:
      data.nfp || [],

    fomc:
      data.fomc || [],

    ppi:
      data.ppi || [],

    gdp:
      data.gdp || []

  };

}


// ============================================================
// Main Handler
// ============================================================

export default async function handler(
  req,
  res
) {

  setCors(res);


  // ==========================================================
  // OPTIONS
  // ==========================================================

  if (
    req.method === "OPTIONS"
  ) {

    return res.status(204).end();

  }


  // ==========================================================
  // METHOD
  // ==========================================================

  if (
    req.method !== "POST"
  ) {

    return res.status(405).json({

      success: false,

      error:
        "Only POST method is allowed"

    });

  }


  // ==========================================================
  // ENVIRONMENT
  // ==========================================================

  const missingKeys = [];


  if (
    !process.env.GEMINI_API_KEY
  ) {

    missingKeys.push(
      "GEMINI_API_KEY"
    );

  }


  if (
    !process.env.TWELVE_DATA_API_KEY
  ) {

    missingKeys.push(
      "TWELVE_DATA_API_KEY"
    );

  }


  if (
    !process.env.FMP_API_KEY
  ) {

    missingKeys.push(
      "FMP_API_KEY"
    );

  }


  if (
    missingKeys.length
  ) {

    return res.status(500).json({

      success: false,

      error:
        "Required environment variables are missing",

      missing:
        missingKeys

    });

  }


  try {

    // ========================================================
    // REQUEST
    // ========================================================

    const body =
      getRequestBody(req);


    const message =
      safeString(
        body.message,
        ""
      ).trim();


    const symbol =
      safeString(
        body.symbol,
        "XAU/USD"
      );


    const interval =
      safeString(
        body.interval,
        "15min"
      );


    const image =
      body.image ||
      null;


    if (
      !message &&
      !image
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Message or image is required"

      });

    }


    // ========================================================
    // DATE RANGE
    // ========================================================

    const startDate =
      getBaghdadDate(-2);


    const endDate =
      getBaghdadDate(14);


    // ========================================================
    // LOAD DATA
    // ========================================================

    const results =
      await Promise.allSettled([

        getMarketSnapshot(
          symbol,
          interval
        ),

        getEconomicCalendar(
          startDate,
          endDate
        )

      ]);


    // ========================================================
    // MARKET RESULT
    // ========================================================

    let market =
      null;


    if (
      results[0].status ===
      "fulfilled"
    ) {

      market =
        results[0].value;

    }


    // ========================================================
    // ECONOMIC RESULT
    // ========================================================

    let economic =
      null;


    if (
      results[1].status ===
      "fulfilled"
    ) {

      economic =
        getImportantUSData(
          results[1].value
        );

    }


    // ========================================================
    // AI DATA STATUS
    // ========================================================

    const marketAvailable =
      Boolean(market);


    const economicAvailable =
      Boolean(economic);


    // ========================================================
    // GEMINI ANALYSIS
    // ========================================================

    const aiResult =
      await analyzeTrading({

        symbol,

        interval,

        message,

        image,

        marketData:
          buildMarketContext(
            market
          ),

        newsData:
          buildEconomicContext(
            economic
          )

      });


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      project:
        "ShahanFX AI Pro",

      answer:
        aiResult.text,

      model:
        aiResult.model,

      symbol,

      interval,

      data: {

        market: {

          available:
            marketAvailable,

          error:
            results[0].status ===
            "rejected"
              ? results[0].reason?.message ||
                "Market data failed"
              : null

        },

        economic: {

          available:
            economicAvailable,

          error:
            results[1].status ===
            "rejected"
              ? results[1].reason?.message ||
                "Economic data failed"
              : null

        }

      },

      timestamp:
        new Date().toISOString()

    });


  } catch (error) {

    // ========================================================
    // GEMINI / SERVER ERROR
    // ========================================================

    const geminiError =
      getGeminiError(
        error
      );


    return res.status(
      geminiError.status >= 500
        ? 503
        : geminiError.status
    ).json({

      success: false,

      project:
        "ShahanFX AI Pro",

      error:
        geminiError.message,

      provider:
        geminiError.provider,

      timestamp:
        new Date().toISOString()

    });

  }

}
