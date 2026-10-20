import { formatMoneyMajor, isSupportedCurrency, type SupportedCurrency } from "./currencies";

// The currency the app shows amounts in (the Wallet's primary currency). A module
// value on purpose: ~50 places format money through usdFormatChanger() and none
// of them had the wallet at hand, so every one of them showed a fixed en-US/USD
// format whatever the wallet used (bugs 51, 59, 101). AllDataProvider keeps it in
// sync with the loaded wallet; before that, and for a wallet with an unsupported
// currency, it stays on MXN (the default primary currency).
let displayCurrency: SupportedCurrency = "MXN";

export function setDisplayCurrency(currency?: unknown): void {
  if (isSupportedCurrency(currency)) displayCurrency = currency;
}

export function getDisplayCurrency(): SupportedCurrency {
  return displayCurrency;
}

// An amount in major units, in the wallet's primary currency, without the currency code
// (the code is clutter next to the symbol in dense tables).
export function formatInPrimaryCurrency(value: number | string | null | undefined): string {
  return formatMoneyMajor(value ?? 0, displayCurrency, { showCode: false });
}
