import { parseSignedMoneyText } from "../transactions/movementForm";
import { SUPPORTED_CURRENCIES } from "../money/currencies";

// The labels are catalog keys ("accounts.type.debit"): the screen shows them with t(label).
export const ACCOUNT_TYPES = [
  { value: "debit", label: "accounts.type.debit" },
  { value: "credit", label: "accounts.type.credit" },
  { value: "cash", label: "accounts.type.cash" },
  { value: "savings", label: "accounts.type.savings" },
] as const;

export const ACCOUNT_CURRENCIES: readonly string[] = SUPPORTED_CURRENCIES;

export interface AccountValues {
  name: string;
  amount: string;
  accountType: string;
  currency: string;
}

export type AccountErrors = Partial<Record<"name" | "amount", string>>;

// The errors are catalog keys ("accounts.error.nameRequired"): the screen shows them with t(key).
export function validateAccount(values: AccountValues): AccountErrors {
  const errors: AccountErrors = {};
  if (!values.name.trim()) errors.name = "accounts.error.nameRequired";
  else if (values.name.trim().length > 40) errors.name = "accounts.error.nameTooLong";
  if (parseSignedMoneyText(values.amount) === null) errors.amount = "accounts.error.amountInvalid";
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
