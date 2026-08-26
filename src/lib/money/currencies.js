// Shared currency metadata and minor-unit helpers. No Mongoose, no secrets -
// safe to import from both client and server code.

export const SUPPORTED_CURRENCIES = ["MXN", "USD", "EUR", "JPY"];

export const CURRENCY_META = {
  MXN: { code: "MXN", minorUnits: 2, locale: "es-MX", label: "Mexican peso", symbol: "$" },
  USD: { code: "USD", minorUnits: 2, locale: "en-US", label: "US dollar", symbol: "$" },
  EUR: { code: "EUR", minorUnits: 2, locale: "de-DE", label: "Euro", symbol: "€" },
  JPY: { code: "JPY", minorUnits: 0, locale: "ja-JP", label: "Japanese yen", symbol: "¥" },
};

export function isSupportedCurrency(currency) {
  return SUPPORTED_CURRENCIES.includes(currency);
}

export function assertSupportedCurrency(currency) {
  if (!isSupportedCurrency(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return currency;
}

export function getMinorUnits(currency) {
  assertSupportedCurrency(currency);
  return CURRENCY_META[currency].minorUnits;
}

// Major (e.g. 125.50) -> minor integer units (e.g. 12550). Uses string-based
// rounding rather than raw float math to avoid classic 0.1 + 0.2 drift.
export function majorToMinor(value, currency) {
  assertSupportedCurrency(currency);
  const minorUnits = getMinorUnits(currency);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`majorToMinor: value is not a finite number: ${value}`);
  }
  const factor = 10 ** minorUnits;
  // Round to the nearest minor unit, half away from zero.
  const rounded = Math.sign(numeric) * Math.round(Math.abs(numeric) * factor);
  return rounded;
}

export function minorToMajor(amountMinor, currency) {
  assertSupportedCurrency(currency);
  const minorUnits = getMinorUnits(currency);
  if (!Number.isFinite(amountMinor)) {
    throw new Error(`minorToMajor: amountMinor is not a finite number: ${amountMinor}`);
  }
  return amountMinor / 10 ** minorUnits;
}

export function formatMoneyMinor(amountMinor, currency, options = {}) {
  assertSupportedCurrency(currency);
  const major = minorToMajor(amountMinor, currency);
  return formatMoneyMajor(major, currency, options);
}

// Transitional helper for legacy plain-number amounts (already in major
// units, e.g. pre-migration Transaction.amount). Do not use for new
// minor-unit-based money.
export function formatMoneyMajor(amount, currency, options = {}) {
  assertSupportedCurrency(currency);
  const meta = CURRENCY_META[currency];
  const { showCode = true, locale } = options;
  const formatted = new Intl.NumberFormat(locale || meta.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: meta.minorUnits,
    maximumFractionDigits: meta.minorUnits,
  }).format(amount ?? 0);
  return showCode ? `${currency} ${formatted}` : formatted;
}

// Reads the native (account) amount/currency off a normalized Transaction DTO.
export function getTransactionNativeMoney(transaction) {
  const account = transaction?.money?.account;
  if (!account) return null;
  return { amountMinor: account.amountMinor, currency: account.currency };
}

// Reads the Wallet-primary-currency amount off a normalized Transaction DTO
// (the `displayMoney.primary` shape produced by the read serializer).
export function getTransactionPrimaryMoney(transaction) {
  const primary = transaction?.displayMoney?.primary;
  if (!primary) return null;
  return { amountMinor: primary.amountMinor, currency: primary.currency };
}
