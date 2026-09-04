// lib/dates.js
// ============================================================
// SHAHANFX AI — DATE & TIME ENGINE
// Timezone: Asia/Baghdad
// ============================================================

const BAGHDAD_TIMEZONE =
  "Asia/Baghdad";


// ============================================================
// Get Current Baghdad Date Parts
// ============================================================

export function getBaghdadParts() {

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          BAGHDAD_TIMEZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hourCycle:
          "h23"
      }
    ).formatToParts(
      new Date()
    );


  const get =
    (type) =>
      parts.find(
        (part) =>
          part.type === type
      )?.value;


  return {

    year:
      Number(get("year")),

    month:
      Number(get("month")),

    day:
      Number(get("day")),

    hour:
      Number(get("hour")),

    minute:
      Number(get("minute")),

    second:
      Number(get("second"))

  };

}


// ============================================================
// Current Baghdad Date
// YYYY-MM-DD
// ============================================================

export function getBaghdadDate(
  offsetDays = 0
) {

  const parts =
    getBaghdadParts();


  const date =
    new Date(
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day
      )
    );


  date.setUTCDate(
    date.getUTCDate() +
    Number(offsetDays || 0)
  );


  return date
    .toISOString()
    .slice(0, 10);

}


// ============================================================
// Current Baghdad Time
// HH:MM:SS
// ============================================================

export function getBaghdadTime() {

  const parts =
    getBaghdadParts();


  return [

    String(parts.hour)
      .padStart(2, "0"),

    String(parts.minute)
      .padStart(2, "0"),

    String(parts.second)
      .padStart(2, "0")

  ].join(":");

}


// ============================================================
// Current Baghdad DateTime
// YYYY-MM-DD HH:MM:SS
// ============================================================

export function getBaghdadDateTime() {

  return (

    getBaghdadDate() +
    " " +
    getBaghdadTime()

  );

}


// ============================================================
// ISO Timestamp
// ============================================================

export function getCurrentISO() {

  return new Date()
    .toISOString();

}


// ============================================================
// Add Days To Date
// ============================================================

export function addDays(
  dateString,
  days = 0
) {

  const date =
    new Date(
      `${dateString}T00:00:00Z`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    throw new Error(
      `Invalid date: ${dateString}`
    );

  }


  date.setUTCDate(
    date.getUTCDate() +
    Number(days || 0)
  );


  return date
    .toISOString()
    .slice(0, 10);

}


// ============================================================
// Date Difference
// ============================================================

export function daysBetween(
  startDate,
  endDate
) {

  const start =
    new Date(
      `${startDate}T00:00:00Z`
    );

  const end =
    new Date(
      `${endDate}T00:00:00Z`
    );


  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {

    throw new Error(
      "Invalid date provided"
    );

  }


  const milliseconds =
    end.getTime() -
    start.getTime();


  return Math.round(
    milliseconds /
    (1000 * 60 * 60 * 24)
  );

}


// ============================================================
// Check Valid Date
// ============================================================

export function isValidDate(
  dateString
) {

  if (
    typeof dateString !==
    "string"
  ) {

    return false;

  }


  if (
    !/^\d{4}-\d{2}-\d{2}$/
      .test(dateString)
  ) {

    return false;

  }


  const date =
    new Date(
      `${dateString}T00:00:00Z`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return false;

  }


  return (
    date
      .toISOString()
      .slice(0, 10) ===
    dateString
  );

}


// ============================================================
// Normalize Date Range
// ============================================================

export function normalizeDateRange(
  startDate,
  endDate,
  defaultPastDays = 2,
  defaultFutureDays = 7
) {

  const start =
    startDate ||
    getBaghdadDate(
      -Math.abs(
        defaultPastDays
      )
    );


  const end =
    endDate ||
    getBaghdadDate(
      Math.abs(
        defaultFutureDays
      )
    );


  if (
    !isValidDate(start)
  ) {

    throw new Error(
      `Invalid startDate: ${start}`
    );

  }


  if (
    !isValidDate(end)
  ) {

    throw new Error(
      `Invalid endDate: ${end}`
    );

  }


  if (
    start > end
  ) {

    throw new Error(
      "startDate cannot be after endDate"
    );

  }


  return {

    startDate:
      start,

    endDate:
      end

  };

}


// ============================================================
// Format Baghdad Date
// ============================================================

export function formatBaghdadDate(
  dateString
) {

  if (
    !isValidDate(dateString)
  ) {

    return null;

  }


  const [
    year,
    month,
    day
  ] =
    dateString.split("-");


  return `${day}/${month}/${year}`;

}


// ============================================================
// Export Timezone
// ============================================================

export {
  BAGHDAD_TIMEZONE
};
