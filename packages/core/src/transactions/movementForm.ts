import { majorToMinor } from "../money/currencies";

// Pure rules for the forms that write movements (Agregar, edit, transfers). The app only draws the
// fields; what is valid, and the body the API receives, is decided here and tested.

export type MovementType = "expense" | "income";

export interface MovementValues {
  type: MovementType;
  amount: string;
  name: string;
  accountId: string;
  categoryId: string;
  subCategoryId: string;
  budgetId: string;
  // YYYY-MM-DD, the local day of the movement.
  date: string;
}

export type MovementErrors = Partial<Record<"amount" | "accountId" | "categoryId" | "date", string>>;

// Money as typed: commas are thousands separators ("1,234.50"), the dot is the decimal point.
// Returns null when it is not a positive amount with at most two decimals of precision kept.
export function parseMoneyText(text: string): number | null {
  const cleaned = text.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// A signed money value (balances can be negative, e.g. a card in debt).
export function parseSignedMoneyText(text: string): number | null {
  const cleaned = text.replace(/,/g, "").trim();
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function dateText(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The local day at noon, or null when the text is not a real date in AAAA-MM-DD.
export function parseDateText(text: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

export function validateMovement(values: MovementValues): MovementErrors {
  const errors: MovementErrors = {};
  if (parseMoneyText(values.amount) === null) errors.amount = "Escribe un monto mayor a cero.";
  if (!values.accountId) errors.accountId = "Elige una cuenta.";
  if (!values.categoryId) errors.categoryId = "Elige una categoría.";
  if (parseDateText(values.date) === null) errors.date = "Usa el formato AAAA-MM-DD.";
  return errors;
}

// The movement's time: the current time when it is today, noon of its day otherwise.
export function movementInstant(dateValue: string, now: Date = new Date()): Date {
  const day = parseDateText(dateValue) ?? now;
  if (dateText(day) === dateText(now)) return now;
  return day;
}

export function buildMovementBody(values: MovementValues, fallbackName: string, now: Date = new Date()): Record<string, unknown> {
  const amount = parseMoneyText(values.amount) ?? 0;
  return {
    name: values.name.trim() || fallbackName,
    amount,
    isIncome: values.type === "income",
    isBill: values.type === "expense",
    isReadable: true,
    date: movementInstant(values.date, now).toISOString(),
    account: values.accountId,
    category: values.categoryId,
    subCategory: values.subCategoryId || null,
    budget: values.budgetId || null,
  };
}

export interface TransferValues {
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAmount: string;
  // Only used when the two accounts have different currencies: what arrives on the other side.
  destinationAmount: string;
  name: string;
  date: string;
}

export type TransferErrors = Partial<Record<"sourceAccountId" | "destinationAccountId" | "sourceAmount" | "destinationAmount" | "date", string>>;

export function validateTransfer(values: TransferValues, currencies: Record<string, string>): TransferErrors {
  const errors: TransferErrors = {};
  if (!values.sourceAccountId) errors.sourceAccountId = "Elige la cuenta de origen.";
  if (!values.destinationAccountId) errors.destinationAccountId = "Elige la cuenta de destino.";
  if (values.sourceAccountId && values.sourceAccountId === values.destinationAccountId) {
    errors.destinationAccountId = "Elige dos cuentas distintas.";
  }
  if (parseMoneyText(values.sourceAmount) === null) errors.sourceAmount = "Escribe un monto mayor a cero.";
  const crossCurrency = isCrossCurrency(values, currencies);
  if (crossCurrency && parseMoneyText(values.destinationAmount) === null) {
    errors.destinationAmount = "Escribe cuánto llega a la otra cuenta.";
  }
  if (parseDateText(values.date) === null) errors.date = "Usa el formato AAAA-MM-DD.";
  return errors;
}

function isCrossCurrency(values: TransferValues, currencies: Record<string, string>): boolean {
  const from = currencies[values.sourceAccountId];
  const to = currencies[values.destinationAccountId];
  return Boolean(from && to && from !== to);
}

// A transfer between accounts of the same currency is a "transfer"; between currencies it is an
// "exchange", and the API needs both amounts in each account's minor units.
export function buildTransferBody(values: TransferValues, currencies: Record<string, string>, now: Date = new Date()): Record<string, unknown> {
  const fromCurrency = currencies[values.sourceAccountId] || "MXN";
  const toCurrency = currencies[values.destinationAccountId] || fromCurrency;
  const crossCurrency = fromCurrency !== toCurrency;
  const sourceMajor = parseMoneyText(values.sourceAmount) ?? 0;
  const destinationMajor = crossCurrency ? parseMoneyText(values.destinationAmount) ?? 0 : sourceMajor;
  return {
    name: values.name.trim() || (crossCurrency ? "Cambio de moneda" : "Transferencia"),
    kind: crossCurrency ? "exchange" : "transfer",
    sourceAccountId: values.sourceAccountId,
    sourceAmountMinor: majorToMinor(sourceMajor, fromCurrency),
    destinationAccountId: values.destinationAccountId,
    destinationAmountMinor: majorToMinor(destinationMajor, toCurrency),
    date: movementInstant(values.date, now).toISOString(),
  };
}
