// api/fomc.js
// ============================================================
// SHAHANFX AI — FOMC ENGINE
// Dedicated US Federal Reserve / Interest Rate API
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
// Normalize FOMC Event
// ============================================================

function normalizeFOMC(event) {
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
      "FOMC",

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
// Check FOMC
// ============================================================

function isFOMC(event) {
  const name =
    String(event.event || "")
      .toLowerCase();

  return (
    name.includes("fomc") ||
    name.includes("federal funds rate") ||
    name.includes("fed interest rate") ||
    name.includes("interest rate decision") ||
    name.includes("federal reserve")
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
  // API KEY
  // ==========================================================

  const FMP_API_KEY =
    process.env.FMP_API_KEY;

  if (!FMP_API_KEY) {
    return res.status(500).json({
      success: false,
      provider: "FMP",
      type: "FOMC",
      error:
        "FMP_API_KEY is missing"
    });
  }


  try {

    // ========================================================
    // REQUEST DATA
    // ========================================================

   
