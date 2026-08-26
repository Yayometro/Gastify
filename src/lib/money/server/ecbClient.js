// Server-only ECB SDMX client. Fetches one focused CSV request for
// USD/MXN/JPY against EUR and parses it defensively - never trusts a
// malformed or partial response.

const ECB_BASE_URL = "https://data-api.ecb.europa.eu/service/data/EXR";
const REQUESTED_CURRENCIES = ["USD", "MXN", "JPY"];
const FETCH_TIMEOUT_MS = 8000;

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

// Parses the ECB SDMX CSV response. Expected columns include (at minimum)
// CURRENCY and OBS_VALUE, plus a date column (TIME_PERIOD). Column order is
// not assumed - resolved by header name.
function parseEcbCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("ecbClient: CSV response has no data rows");
  }

  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const currencyIdx = header.indexOf("CURRENCY");
  const valueIdx = header.indexOf("OBS_VALUE");
  const dateIdx = header.indexOf("TIME_PERIOD");

  if (currencyIdx === -1 || valueIdx === -1 || dateIdx === -1) {
    throw new Error(`ecbClient: unexpected CSV header shape: ${lines[0]}`);
  }

  // Keep only the most recent observation per currency (rows are typically
  // ordered oldest->newest for the requested range).
  const byCurrency = {};
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw) continue;
    const cols = raw.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const currency = cols[currencyIdx];
    const value = cols[valueIdx];
    const date = cols[dateIdx];
    if (!currency || !value || !date) continue;
    if (!REQUESTED_CURRENCIES.includes(currency)) continue;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) continue;
    // Overwrite so the last (most recent) row for this currency wins.
    byCurrency[currency] = { value, date };
  }

  const missing = REQUESTED_CURRENCIES.filter((c) => !byCurrency[c]);
  if (missing.length > 0) {
    throw new Error(`ecbClient: missing rate(s) for ${missing.join(", ")} in ECB response`);
  }

  const dates = new Set(Object.values(byCurrency).map((v) => v.date));
  const rawSourceDate = dates.size === 1 ? [...dates][0] : [...dates].sort().pop();

  return {
    rates: {
      EUR: "1",
      USD: byCurrency.USD.value,
      MXN: byCurrency.MXN.value,
      JPY: byCurrency.JPY.value,
    },
    rawSourceDate,
  };
}

// Fetches ECB reference rates for USD/MXN/JPY (vs EUR) for the given date
// range. Returns { rates, rawSourceDate } or throws. Callers decide caching.
export async function fetchEcbRates({ startDate, endDate }) {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);
  const key = `D.${REQUESTED_CURRENCIES.join("+")}.EUR.SP00.A`;
  const url = `${ECB_BASE_URL}/${key}?startPeriod=${start}&endPeriod=${end}&format=csvdata`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/csv" },
    });
    if (!res.ok) {
      throw new Error(`ecbClient: ECB responded with status ${res.status}`);
    }
    const text = await res.text();
    return parseEcbCsv(text);
  } finally {
    clearTimeout(timeout);
  }
}

export { parseEcbCsv };
