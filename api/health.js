// api/health.js
// ============================================================
// SHAHANFX AI — HEALTH CHECK
// Backend + Environment Variables Status
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
    "GET, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  // ==========================================================
  // OPTIONS
  // ==========================================================

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }


  // ==========================================================
  // ONLY GET
  // ==========================================================

  if (req.method !== "GET") {

    return res.status(405).json({
      success: false,
      error: "Only GET method is allowed"
    });

  }


  try {

    // ========================================================
    // ENVIRONMENT VARIABLES
    // ========================================================

    const gemini =
      Boolean(process.env.GEMINI_API_KEY);

    const twelveData =
      Boolean(process.env.TWELVE_DATA_API_KEY);

    const fmp =
      Boolean(process.env.FMP_API_KEY);


    // ========================================================
    // OVERALL STATUS
    // ========================================================

    const allProvidersReady =
      gemini &&
      twelveData &&
      fmp;


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      project: "ShahanFX AI",

      status:
        allProvidersReady
          ? "online"
          : "partial",

      message:
        allProvidersReady
          ? "ShahanFX AI backend is ready"
          : "ShahanFX AI backend is online but some providers are missing",

      environment: {

        GEMINI_API_KEY:
          gemini,

        TWELVE_DATA_API_KEY:
          twelveData,

        FMP_API_KEY:
          fmp

      },

      engines: {

        chat:
          gemini,

        market:
          twelveData,

        news:
          fmp,

        cpi:
          fmp,

        nfp:
          fmp,

        fomc:
          fmp,

        ppi:
          fmp,

        gdp:
          fmp

      },

      runtime: {

        node:
          process.version,

        platform:
          process.platform,

        timestamp:
          new Date().toISOString()

      }

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      project: "ShahanFX AI",

      status: "error",

      error:
        error.message ||
        "Health check failed"

    });

  }

}
