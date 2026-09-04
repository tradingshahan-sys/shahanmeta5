// api/gdp.js
// ============================================================
// SHAHANFX AI — GDP ENGINE
// Dedicated US Gross Domestic Product Economic Calendar API
// Provider: Financial Modeling Prep (FMP)
// ============================================================

function getBaghdadDate(offsetDays = 0) {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);

  const year = Number(
    parts.find((p) => p.type === "year").value
  );

  const month = Number(
    parts.find((p) => p.type === "month").value
  );

  const day = Number(
    parts.find((p) => p.type === "day").value
  );

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(
    date.getUTCDate() + offsetDays
  );

  return date.toISOString().slice(0, 10);
}


// ============================================================
// Normalize GDP Event
// ============================================================

function normalizeGDP(event) {
  const actual =
    event.actual ??
    null;

  const forecast =
    event.estimate ??
    event.forecast ??
    null;

  const previous =
    event.previous ??
    null;

  const released =
    actual !== null &&
    actual !== undefined &&
    actual !== "";

  return {
    date:
      event.date ||
      null,

    country:
      event.country ||
      "US",

    currency:
      event.currency ||
      "USD",

    event:
      event.event ||
      "GDP",

    impact:
      event.impact ||
      null,

    actual,

    forecast,

    previous,

    unit:
      event.unit ||
      null,

    released
  };
}


// ============================================================
// Check US
// ============================================================

function isUS(event) {
  const country =
    String(event.country || "")
      .trim()
      .toUpperCase();

  const currency =
    String(event.currency || "")
      .trim()
      .toUpperCase();

  return (
    country === "US" ||
    country === "USA" ||
    country === "UNITED STATES" ||
    currency === "USD"
  );
}


// ============================================================
// Check GDP
// ============================================================

function isGDP(event) {
  const name =
    String(event.event || "")
      .toLowerCase();

  return (
    name.includes("gross domestic product") ||
    name.includes("gdp")
  );
}


// ============================================================
// Handler
// ============================================================

export default async function handler(req, res) {

  // ==========================================================
  // CORS
  // ==========================================================

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

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }


  // ==========================================================
  // METHODS
  // ==========================================================

  if (
    req.method !== "GET" &&
    req.method !== "POST"
  ) {
    return res.status(405).json({
      success: false,
      error:
        "Only GET and POST methods are allowed"
    });
  }


  // ==========================================================
  // FMP API KEY
  // ==========================================================

  const FMP_API_KEY =
    process.env.FMP_API_KEY;

  if (!FMP_API_KEY) {
    return res.status(500).json({
      success: false,
      provider: "FMP",
      type: "GDP",
      error:
        "FMP_API_KEY is missing"
    });
  }


  try {

    // ========================================================
    // REQUEST DATA
    // ========================================================

    const body =
      req.method === "POST" &&
      req.body
        ? req.body
        : {};

    const query =
      req.query || {};


    // ========================================================
    // DATE RANGE
    // GDP EVENTS ARE LESS FREQUENT
    // 7 DAYS BACK → 60 DAYS FORWARD
    // ========================================================

    const startDate =
      body.startDate ||
      query.startDate ||
      getBaghdadDate(-7);

    const endDate =
      body.endDate ||
      query.endDate ||
      getBaghdadDate(60);


    // ========================================================
    // FMP URL
    // ========================================================

    const url =
      "https://financialmodelingprep.com/stable/economic-calendar" +

      `?from=${encodeURIComponent(startDate)}` +

      `&to=${encodeURIComponent(endDate)}` +

      `&apikey=${encodeURIComponent(FMP_API_KEY)}`;


    // ========================================================
    // FETCH
    // ========================================================

    const response =
      await fetch(url);

    const rawText =
      await response.text();

    let data;

    try {

      data =
        JSON.parse(rawText);

    } catch {

      return res.status(502).json({
        success: false,
        provider: "FMP",
        type: "GDP",
        error:
          "FMP returned invalid JSON"
      });

    }


    // ========================================================
    // PROVIDER ERROR
    // ========================================================

    if (!response.ok) {

      return res.status(502).json({

        success: false,

        provider: "FMP",

        type: "GDP",

        providerStatus:
          response.status,

        error:

          data?.["Error Message"] ||

          data?.message ||

          `FMP HTTP ${response.status}`,

        range: {
          startDate,
          endDate
        }

      });

    }


    // ========================================================
    // VALIDATE RESPONSE
    // ========================================================

    if (!Array.isArray(data)) {

      return res.status(502).json({

        success: false,

        provider: "FMP",

        type: "GDP",

        error:
          "Unexpected FMP response",

        details:
          data,

        range: {
          startDate,
          endDate
        }

      });

    }


    // ========================================================
    // FILTER GDP
    // ========================================================

    const gdp =
      data

        .filter(isUS)

        .filter(isGDP)

        .map(normalizeGDP)

        .sort((a, b) =>
          String(a.date)
            .localeCompare(
              String(b.date)
            )
        );


    // ========================================================
    // UPCOMING
    // ========================================================

    const upcoming =
      gdp.filter(
        (event) =>
          !event.released
      );


    // ========================================================
    // RELEASED
    // ========================================================

    const released =
      gdp.filter(
        (event) =>
          event.released
      );


    // ========================================================
    // LATEST
    // ========================================================

    const latest =
      released.length
        ? released[released.length - 1]
        : null;


    // ========================================================
    // NEXT
    // ========================================================

    const next =
      upcoming.length
        ? upcoming[0]
        : null;


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      provider: "FMP",

      type: "GDP",

      country: "US",

      currency: "USD",

      range: {
        startDate,
        endDate
      },

      count:
        gdp.length,

      gdp,

      upcoming,

      released,

      latest,

      next,

      summary: {

        total:
          gdp.length,

        upcoming:
          upcoming.length,

        released:
          released.length,

        hasUpcoming:
          Boolean(next),

        hasLatest:
          Boolean(latest)

      },

      timestamp:
        new Date().toISOString()

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      provider: "FMP",

      type: "GDP",

      error:
        error.message ||
        "GDP engine server error"

    });

  }

}
