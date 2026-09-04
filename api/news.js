// api/news.js
// ============================================================
// SHAHANFX AI — ECONOMIC NEWS ENGINE
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

function normalizeEvent(event) {
  return {
    date: event.date || null,

    country: event.country || null,

    currency: event.currency || null,

    event: event.event || "",

    impact: event.impact || null,

    actual:
      event.actual ??
      null,

    forecast:
      event.estimate ??
      event.forecast ??
      null,

    previous:
      event.previous ??
      null,

    unit:
      event.unit ??
      null
  };
}

function detectType(eventName) {
  const name = String(eventName || "")
    .toLowerCase();

  if (
    name.includes("consumer price index") ||
    name.includes("cpi")
  ) {
    return "CPI";
  }

  if (
    name.includes("nonfarm") ||
    name.includes("non-farm") ||
    name.includes("nonfarm payroll") ||
    name.includes("nfp")
  ) {
    return "NFP";
  }

  if (
    name.includes("fomc") ||
    name.includes("federal funds rate") ||
    name.includes("interest rate decision") ||
    name.includes("fed interest rate")
  ) {
    return "FOMC";
  }

  if (
    name.includes("producer price index") ||
    name.includes("ppi")
  ) {
    return "PPI";
  }

  if (
    name.includes("gross domestic product") ||
    name.includes("gdp")
  ) {
    return "GDP";
  }

  if (
    name.includes("unemployment rate")
  ) {
    return "UNEMPLOYMENT";
  }

  if (
    name.includes("retail sales")
  ) {
    return "RETAIL_SALES";
  }

  if (
    name.includes("initial jobless claims")
  ) {
    return "JOBLESS_CLAIMS";
  }

  if (
    name.includes("pmi")
  ) {
    return "PMI";
  }

  if (
    name.includes("powell")
  ) {
    return "POWELL";
  }

  if (
    name.includes("federal reserve") ||
    name.includes("fed")
  ) {
    return "FED";
  }

  return "OTHER";
}

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
      error: "Only GET and POST are allowed"
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
      error:
        "FMP_API_KEY is not configured"
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

    const startDate =
      body.startDate ||
      query.startDate ||
      getBaghdadDate(-2);

    const endDate =
      body.endDate ||
      query.endDate ||
      getBaghdadDate(7);

    // ========================================================
    // FMP ECONOMIC CALENDAR
    // ========================================================

    const url =
      "https://financialmodelingprep.com/stable/economic-calendar" +
      `?from=${encodeURIComponent(startDate)}` +
      `&to=${encodeURIComponent(endDate)}` +
      `&apikey=${encodeURIComponent(FMP_API_KEY)}`;

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
    // FILTER US EVENTS
    // ========================================================

    const events =
      data
        .filter(isUS)
        .map((event) => {

          const normalized =
            normalizeEvent(event);

          return {
            ...normalized,

            type:
              detectType(
                normalized.event
              )
          };
        })
        .sort((a, b) =>
          String(a.date)
            .localeCompare(
              String(b.date)
            )
        );

    // ========================================================
    // IMPORTANT EVENTS
    // ========================================================

    const importantNews =
      events.filter((event) => {

        return [
          "CPI",
          "NFP",
          "FOMC",
          "PPI",
          "GDP",
          "UNEMPLOYMENT",
          "RETAIL_SALES",
          "JOBLESS_CLAIMS",
          "PMI",
          "POWELL",
          "FED"
        ].includes(event.type);

      });

    // ========================================================
    // CATEGORY FILTERS
    // ========================================================

    const cpi =
      events.filter(
        (event) =>
          event.type === "CPI"
      );

    const nfp =
      events.filter(
        (event) =>
          event.type === "NFP"
      );

    const fomc =
      events.filter(
        (event) =>
          event.type === "FOMC"
      );

    const ppi =
      events.filter(
        (event) =>
          event.type === "PPI"
      );

    const gdp =
      events.filter(
        (event) =>
          event.type === "GDP"
      );

    const highImpact =
      events.filter((event) =>
        String(event.impact || "")
          .toLowerCase()
          .includes("high")
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      provider: "FMP",

      range: {
        startDate,
        endDate
      },

      count:
        events.length,

      events,

      importantNews,

      highImpact,

      cpi,

      nfp,

      fomc,

      ppi,

      gdp,

      summary: {
        totalEvents:
          events.length,

        importantEvents:
          importantNews.length,

        highImpactEvents:
          highImpact.length,

        cpiEvents:
          cpi.length,

        nfpEvents:
          nfp.length,

        fomcEvents:
          fomc.length,

        ppiEvents:
          ppi.length,

        gdpEvents:
          gdp.length
      },

      timestamp:
        new Date().toISOString()
    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      provider: "FMP",

      error:
        error.message ||
        "Economic news engine error"
    });
  }
}
