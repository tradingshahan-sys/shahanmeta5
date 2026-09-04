// lib/helpers.js
// ============================================================
// SHAHANFX AI — COMMON HELPERS
// Shared utility functions
// ============================================================


// ============================================================
// Safe String
// ============================================================

export function safeString(
  value,
  fallback = ""
) {

  if (
    value === null ||
    value === undefined
  ) {

    return fallback;

  }

  return String(value);

}


// ============================================================
// Safe Number
// ============================================================

export function safeNumber(
  value,
  fallback = null
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {

    return fallback;

  }


  return number;

}


// ============================================================
// Round Number
// ============================================================

export function roundNumber(
  value,
  decimals = 2
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {

    return null;

  }


  const factor =
    10 ** Number(decimals);


  return (
    Math.round(
      number * factor
    ) / factor
  );

}


// ============================================================
// Clamp Number
// ============================================================

export function clamp(
  value,
  min,
  max
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {

    return min;

  }


  return Math.min(
    Math.max(
      number,
      min
    ),
    max
  );

}


// ============================================================
// Percentage
// ============================================================

export function percentage(
  value,
  total,
  decimals = 2
) {

  const a =
    Number(value);

  const b =
    Number(total);


  if (
    !Number.isFinite(a) ||
    !Number.isFinite(b) ||
    b === 0
  ) {

    return null;

  }


  return roundNumber(
    (a / b) * 100,
    decimals
  );

}


// ============================================================
// Change Percentage
// ============================================================

export function changePercent(
  current,
  previous,
  decimals = 2
) {

  const currentValue =
    Number(current);

  const previousValue =
    Number(previous);


  if (
    !Number.isFinite(
      currentValue
    ) ||
    !Number.isFinite(
      previousValue
    ) ||
    previousValue === 0
  ) {

    return null;

  }


  return roundNumber(
    (
      (
        currentValue -
        previousValue
      ) /
      previousValue
    ) * 100,
    decimals
  );

}


// ============================================================
// Direction
// ============================================================

export function getDirection(
  current,
  previous
) {

  const a =
    Number(current);

  const b =
    Number(previous);


  if (
    !Number.isFinite(a) ||
    !Number.isFinite(b)
  ) {

    return "NEUTRAL";

  }


  if (a > b) {

    return "BULLISH";

  }


  if (a < b) {

    return "BEARISH";

  }


  return "NEUTRAL";

}


// ============================================================
// Boolean Parser
// ============================================================

export function toBoolean(
  value,
  fallback = false
) {

  if (
    typeof value ===
    "boolean"
  ) {

    return value;

  }


  if (
    typeof value !==
    "string"
  ) {

    return fallback;

  }


  const normalized =
    value
      .trim()
      .toLowerCase();


  if (
    [
      "true",
      "1",
      "yes",
      "on"
    ].includes(normalized)
  ) {

    return true;

  }


  if (
    [
      "false",
      "0",
      "no",
      "off"
    ].includes(normalized)
  ) {

    return false;

  }


  return fallback;

}


// ============================================================
// Clean Object
// Removes undefined values
// ============================================================

export function cleanObject(
  object
) {

  if (
    !object ||
    typeof object !==
    "object" ||
    Array.isArray(object)
  ) {

    return object;

  }


  return Object.fromEntries(

    Object.entries(object)
      .filter(
        ([, value]) =>
          value !== undefined
      )

  );

}


// ============================================================
// Clean Array
// ============================================================

export function cleanArray(
  array
) {

  if (
    !Array.isArray(array)
  ) {

    return [];

  }


  return array.filter(
    (item) =>
      item !==
      undefined &&
      item !==
      null
  );

}


// ============================================================
// Safe JSON Parse
// ============================================================

export function safeJsonParse(
  value,
  fallback = null
) {

  if (
    typeof value !==
    "string"
  ) {

    return fallback;

  }


  try {

    return JSON.parse(
      value
    );

  } catch {

    return fallback;

  }

}


// ============================================================
// Safe JSON Stringify
// ============================================================

export function safeJsonStringify(
  value,
  fallback = "{}"
) {

  try {

    return JSON.stringify(
      value
    );

  } catch {

    return fallback;

  }

}


// ============================================================
// Get Request Body
// ============================================================

export function getRequestBody(
  req
) {

  if (
    !req ||
    typeof req !==
    "object"
  ) {

    return {};

  }


  if (
    req.body &&
    typeof req.body ===
    "object"
  ) {

    return req.body;

  }


  if (
