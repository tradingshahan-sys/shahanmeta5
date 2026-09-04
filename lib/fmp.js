// lib/fmp.js
// ============================================================
// SHAHANFX AI — FMP DATA ENGINE
// Financial Modeling Prep shared client
// ============================================================

const FMP_BASE_URL =
  "https://financialmodelingprep.com/stable";


// ============================================================
// Get API Key
// ============================================================

function getFMPApiKey() {

  const apiKey =
    process.env.FMP_API_KEY;

  if (!apiKey) {
    throw new Error(
      "FMP_API_KEY is missing"
    );
  }

  return apiKey;
}


// ============================================================
// Build URL
// ============================================================

function buildFMPUrl(
  endpoint,
  params = {}
) {

  const apiKey =
    getFMPApiKey();

  const url =
    new URL(
      `${FMP_BASE_URL}/${endpoint}`
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
// Generic FMP Request
// ============================================================

export async function fmpRequest(
  endpoint,
  params = {}
) {

  const url =
    buildFMPUrl(
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
      "FMP returned invalid JSON"
    );

  }


  if (!response.ok) {

    const providerError =
      data?.["Error Message"] ||
      data?.message ||
      `FMP HTTP ${response.status}`;

    const error =
      new Error(
        providerError
      );

    error.status =
      response.status;

    error.provider =
      "FMP";

    error.data =
      data;

    throw error;

  }


  return data;
}


// ============================================================
// Economic Calendar
// ============================================================

export async function getEconomicCalendar(
  startDate,
  endDate
) {

  return fmpRequest(
    "economic-calendar",
    {
      from: startDate,
      to: endDate
    }
  );

}


// ============================================================
// Search Economic Events
// ============================================================

export async function getEconomicEvents(
  startDate,
  endDate,
  filterFunction
) {

  const data =
    await getEconomicCalendar(
      startDate,
      endDate
    );

  if (!Array.isArray(data)) {

    throw new Error(
      "FMP economic calendar returned unexpected data"
    );

  }

  if (
    typeof filterFunction !==
    "function"
  ) {

    return data;

  }

  return data.filter(
    filterFunction
  );

}


// ============================================================
// Check FMP Connection
// ============================================================

export async function checkFMP() {

  try {

    getFMPApiKey();

    return {
      ok: true,
      provider: "FMP"
    };

  } catch (error) {

    return {
      ok: false,
      provider: "FMP",
      error:
        error.message ||
        "FMP configuration error"
    };

  }

}


// ============================================================
// Safe Error Information
// ============================================================

export function getFMPError(
  error
) {

  return {

    provider:
      error?.provider ||
      "FMP",

    status:
      error?.status ||
      500,

    message:
      error?.message ||
      "FMP request failed"

  };

}


// ============================================================
// Export Helpers
// ============================================================

export {
  getFMPApiKey,
  buildFMPUrl
};
