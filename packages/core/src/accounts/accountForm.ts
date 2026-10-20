import { parseSignedMoneyText } from "../transactions/movementForm";
import { SUPPORTED_CURRENCIES } from "../money/currencies";

export const ACCOUNT_TYPES = [
  { value: "debit", label: "Débito" },
  { value: "credit", label: "Crédito" },
  { value: "cash", label: "Efectivo" },
  { value: "savings", label: "Ahorro" },
] as const;

export const ACCOUNT_CURRENCIES: readonly string[] = SUPPORTED_CURRENCIES;

export interface AccountValues {
  name: string;
  amount: string;
  accountType: string;
  currency: string;
}

export type AccountErrors = Partial<Record<"name" | "amount", string>>;

export function validateAccount(values: AccountValues): AccountErrors {
  const errors: AccountErrors = {};
  if (!values.name.trim()) errors.name = "Escribe un nombre.";
  else if (values.name.trim().length > 40) errors.name = "Usa como máximo 40 caracteres.";
  if (parseSignedMoneyText(values.amount) === null) errors.amount = "Escribe un saldo, por ejemplo 1500 o -800.";
  return errors;
}

// The list after moving one item up or down; the same array when the move is not possible.
export function moveInList<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
