// api/cpi.js
// ============================================================
// SHAHANFX AI — CPI ENGINE
// Dedicated US CPI Economic Calendar API
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
// Normalize CPI Event
// ============================================================

function normalizeCPI(event) {
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
      "CPI",

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
// Check US Event
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
// Check CPI
// ============================================================

function isCPI(event) {
  const name =
    String(event.event || "")
      .toLowerCase();

  return (
    name.includes("consumer price index") ||
    name.includes("cpi")
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
  // METHOD
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
  // API KEY
  // ==========================================================

  const FMP_API_KEY =
    process.env.FMP_API_KEY;

  if (!FMP_API_KEY) {
    return res.status(500).json({
      success: false,
      provider: "FMP",
      error:
        "FMP_API_KEY is missing"
    });
  }


  try {

    // ========================================================
    // REQUEST
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
    // Default:
    // 2 days back → 14 days forward
    // ========================================================

    const startDate =
      body.startDate ||
      query.startDate ||
      getBaghdadDate(-2);

    const endDate =
      body.endDate ||
      query.endDate ||
      getBaghdadDate(14);


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
    // RESPONSE VALIDATION
    // ========================================================

    if (!Array.isArray(data)) {

      return res.status(502).json({
        success: false,

        provider: "FMP",

        error:
          "Unexpected FMP response",

        details: data,

        range: {
          startDate,
          endDate
        }
      });
    }


    // ========================================================
    // FILTER CPI
    // ========================================================

    const cpi =
      data
        .filter(isUS)
        .filter(isCPI)
        .map(normalizeCPI)
        .sort((a, b) =>
          String(a.date)
            .localeCompare(
              String(b.date)
            )
        );


    // ========================================================
    // UPCOMING / RELEASED
    // ========================================================

    const upcoming =
      cpi.filter(
        (event) =>
          !event.released
      );

    const released =
      cpi.filter(
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

      type: "CPI",

      country: "US",

      currency: "USD",

      range: {
        startDate,
        endDate
      },

      count:
        cpi.length,

      cpi,

      upcoming,

      released,

      latest,

      next,

      summary: {

        total:
          cpi.length,

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

      type: "CPI",

      error:
        error.message ||
        "CPI engine server error"

    });
  }
}
