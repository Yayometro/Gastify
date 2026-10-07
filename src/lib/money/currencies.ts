// Shared currency metadata and minor-unit helpers. No Mongoose, no secrets -
// safe to import from both client and server code.

export const SUPPORTED_CURRENCIES: string[] = ["MXN", "USD", "EUR", "JPY"];

export type SupportedCurrency = "MXN" | "USD" | "EUR" | "JPY";

export interface CurrencyMeta {
  code: SupportedCurrency;
  minorUnits: number;
  locale: string;
  label: string;
  symbol: string;
}

export interface FormatMoneyOptions {
  showCode?: boolean;
  locale?: string;
}

export interface TransactionMoneyAmount {
  amountMinor: number;
  currency: string;
}

export interface TransactionWithMoney {
  money?: {
    account?: {
      amountMinor: number;
      currency: string;
    } | null;
  } | null;
  displayMoney?: {
    primary?: {
      amountMinor: number;
      currency: string;
    } | null;
  } | null;
}

export const CURRENCY_META: Record<string, CurrencyMeta> = {
  MXN: { code: "MXN", minorUnits: 2, locale: "es-MX", label: "Mexican peso", symbol: "$" },
  USD: { code: "USD", minorUnits: 2, locale: "en-US", label: "US dollar", symbol: "$" },
  EUR: { code: "EUR", minorUnits: 2, locale: "de-DE", label: "Euro", symbol: "€" },
  JPY: { code: "JPY", minorUnits: 0, locale: "ja-JP", label: "Japanese yen", symbol: "¥" },
};

export function isSupportedCurrency(currency: unknown): currency is SupportedCurrency {
  return typeof currency === "string" && SUPPORTED_CURRENCIES.includes(currency);
}

export function assertSupportedCurrency(currency: unknown): SupportedCurrency {
  if (!isSupportedCurrency(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return currency;
}

export function getMinorUnits(currency: SupportedCurrency | string | unknown): number {
  assertSupportedCurrency(currency);
  return CURRENCY_META[currency as string].minorUnits;
}

// Major (e.g. 125.50) -> minor integer units (e.g. 12550). Uses string-based
// rounding rather than raw float math to avoid classic 0.1 + 0.2 drift.
export function majorToMinor(value: number | string | unknown, currency: SupportedCurrency | string | unknown): number {
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

export function minorToMajor(amountMinor: number | unknown, currency: SupportedCurrency | string | unknown): number {
  assertSupportedCurrency(currency);
  const minorUnits = getMinorUnits(currency);
  if (!Number.isFinite(amountMinor as number)) {
    throw new Error(`minorToMajor: amountMinor is not a finite number: ${amountMinor}`);
  }
  return (amountMinor as number) / 10 ** minorUnits;
}

export function formatMoneyMinor(
  amountMinor: number | unknown,
  currency: SupportedCurrency | string | unknown,
  options: FormatMoneyOptions = {}
): string {
  assertSupportedCurrency(currency);
  const major = minorToMajor(amountMinor, currency);
  return formatMoneyMajor(major, currency, options);
}

// Transitional helper for legacy plain-number amounts (already in major
// units, e.g. pre-migration Transaction.amount). Do not use for new
// minor-unit-based money.
export function formatMoneyMajor(
  amount: number | string | unknown,
  currency: SupportedCurrency | string | unknown,
  options: FormatMoneyOptions = {}
): string {
  assertSupportedCurrency(currency);
  const meta = CURRENCY_META[currency as string];
  const { showCode = true, locale } = options;
  const formatted = new Intl.NumberFormat(locale || meta.locale, {
    style: "currency",
    currency: currency as string,
    minimumFractionDigits: meta.minorUnits,
    maximumFractionDigits: meta.minorUnits,
  }).format(Number.isFinite(Number(amount ?? 0)) ? Number(amount ?? 0) : 0); // NaN / Infinity read as 0, not "NaN"
  return showCode ? `${currency} ${formatted}` : formatted;
}

// Reads the native (account) amount/currency off a normalized Transaction DTO.
export function getTransactionNativeMoney(transaction?: TransactionWithMoney | null): TransactionMoneyAmount | null {
  const account = transaction?.money?.account;
  if (!account) return null;
  return { amountMinor: account.amountMinor, currency: account.currency };
}

// Reads the Wallet-primary-currency amount off a normalized Transaction DTO
// (the `displayMoney.primary` shape produced by the read serializer).
export function getTransactionPrimaryMoney(transaction?: TransactionWithMoney | null): TransactionMoneyAmount | null {
  const primary = transaction?.displayMoney?.primary;
  if (!primary) return null;
  return { amountMinor: primary.amountMinor, currency: primary.currency };
}
