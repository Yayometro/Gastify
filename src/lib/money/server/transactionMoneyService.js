// Server-side enrichment for Transaction writes: resolves the full `money`
// object (account/merchant/reporting) that write routes assign onto a
// Transaction before saving, using the real Account currency and Wallet
// primary currency rather than the Transaction model's MXN-only
// pre-validate fallback (which exists only to keep pre-Phase-5 write paths
// from breaking, per src/model/Transaction.js).

import {
  buildAccountMoney,
  buildMerchantMoney,
  buildManualReportingMoney,
  buildSameCurrencyReportingMoney,
} from "@/lib/money/transactionMoney";
import { convert } from "./fxRateService";

// Never fakes a rate - if ECB is unreachable and there is no usable cache for
// a genuinely cross-currency Transaction, this throws rather than silently
// recording a wrong reporting value. Callers should surface the error to the
// user (e.g. "try again in a moment") rather than retry with a fabricated rate.
export async function buildTransactionMoney({
  accountAmount,
  accountCurrency,
  merchantAmount,
  merchantCurrency,
  walletPrimaryCurrency,
  date,
  manualReportingAmount,
}) {
  const account = buildAccountMoney({ amount: accountAmount, currency: accountCurrency });
  const merchant = buildMerchantMoney({ amount: merchantAmount, currency: merchantCurrency });
  const effectiveDate = date || new Date();

  let reporting;
  if (manualReportingAmount !== undefined && manualReportingAmount !== null && manualReportingAmount !== "") {
    reporting = buildManualReportingMoney({
      amount: manualReportingAmount,
      currency: walletPrimaryCurrency,
      accountMoney: account,
      effectiveDate,
    });
  } else if (accountCurrency === walletPrimaryCurrency) {
    reporting = buildSameCurrencyReportingMoney({ accountMoney: account, effectiveDate });
  } else {
    const quote = await convert({
      amountMinor: account.amountMinor,
      fromCurrency: accountCurrency,
      toCurrency: walletPrimaryCurrency,
      date: effectiveDate,
    });
    if (!quote.available) {
      throw new Error(
        `Exchange-rate estimate unavailable for ${accountCurrency} -> ${walletPrimaryCurrency}. Try again in a moment, or enter the equivalent manually.`
      );
    }
    reporting = {
      amountMinor: quote.amountMinor,
      currency: walletPrimaryCurrency,
      rate: quote.rate,
      source: quote.source,
      effectiveDate: quote.effectiveDate,
      estimated: quote.estimated,
    };
  }

  return { account, merchant, reporting };
}
