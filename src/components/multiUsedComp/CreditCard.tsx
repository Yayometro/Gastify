"use client";
import React, { useEffect, useState } from "react";
import "@/components/styles/animations.css";

import "animate.css";
import AccountCardFace from "./AccountCardFace";
import fetcher from "@/helpers/fetcher";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { formatMoneyMinor, majorToMinor, minorToMajor } from "@gastify/core/money/currencies";
import { getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import type { RootState } from "@/lib/store";


export interface CreditCardAccountRef {
  _id?: string;
  bankId?: string | null;
  cardNumber?: string | null;
  name?: string | null;
  currency?: string | null;
  amount?: number | null;
  color?: string | null;
  [key: string]: unknown;
}

export interface CreditCardTransaction {
  _id?: string;
  account?: { _id?: string; [key: string]: unknown } | null;
  amount?: number | string | null;
  isReadable?: boolean | null;
  isBill?: boolean | null;
  isIncome?: boolean | null;
  date?: string | Date | null;
  createdAt?: string | Date | null;
  displayMoney?: {
    native?: {
      currency?: string;
      amountMinor?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface EquivalentQuote {
  rate?: number;
  source?: string;
  stale?: boolean;
  effectiveDate?: string | Date;
  amountMinor?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface CreditCardProps {
  acc?: CreditCardAccountRef | null;
  user?: unknown;
  trans?: CreditCardTransaction[] | null;
  cardColor?: string | null;
  current?: boolean | null;
  walletPrimaryCurrency?: string | null;
  // The period chosen at the top of the page (the same one every card follows).
  timePeriod?: [Date, Date] | null;
  /** Supplied only on the public demo to avoid live FX/API requests. */
  demoRatesToMxn?: Record<string, number>;
  /** Keep account cards inside the public, read-only demo. */
  readOnly?: boolean;
}

// A transaction's own native amount, in its own native currency - as
// opposed to getPrimaryAmount, which converts to the Wallet's primary
// currency. Used to show a foreign-currency account's totals in its own
// currency first, matching how "Current" already shows the native balance.
function getNativeAmount(tra?: CreditCardTransaction | null): number {
  const native = tra?.displayMoney?.native;
  if (native && native.currency) return minorToMajor(native.amountMinor, native.currency);
  return Number(tra?.amount) || 0;
}

function CreditCard({
  acc,
  user,
  trans,
  walletPrimaryCurrency: walletPrimaryCurrencyProp,
  timePeriod,
  demoRatesToMxn,
  readOnly = false,
}: CreditCardProps): React.JSX.Element {
  const router = useRouter();
  const reduxWalletPrimaryCurrency = (useSelector((state: RootState) => state.walletReducer?.data) as { primaryCurrency?: string })?.primaryCurrency;
  const walletPrimaryCurrency: string = walletPrimaryCurrencyProp || reduxWalletPrimaryCurrency || "MXN";
  const [allTransactions, setAllTransacctions] = useState<CreditCardTransaction[]>([]);
  const [account, setAccount] = useState<CreditCardAccountRef>([] as unknown as CreditCardAccountRef);
  const [, setTotalReadTransactions] = useState<CreditCardTransaction[]>([]);
  const [, setBillTransactions] = useState<CreditCardTransaction[]>([]);
  const [, setIncomeTransactions] = useState<CreditCardTransaction[]>([]);
  const [totalBill, setTotalBill] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [nativeTotalBill, setNativeTotalBill] = useState(0);
  const [nativeTotalIncome, setNativeTotalIncome] = useState(0);
  const periodStartMs = timePeriod?.[0] ? new Date(timePeriod[0]).getTime() : null;
  const periodEndMs = timePeriod?.[1] ? new Date(timePeriod[1]).getTime() : null;
  const [equivalentQuote, setEquivalentQuote] = useState<EquivalentQuote | null>(null);
  const accountCurrency = account?.currency || "MXN";

  useEffect(() => {
    if (acc && user && trans) {
      // console.log(acc)
      // console.log(user)
      // console.log(trans)
      setAllTransacctions(trans);
      setAccount(acc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acc, user, trans]);

  useEffect(() => {
    // The top period of the page; without one, the last 30 days.
    const rangeEnd = periodEndMs !== null ? new Date(periodEndMs) : new Date();
    rangeEnd.setHours(23, 59, 59, 999);
    const rangeStart = periodStartMs !== null ? new Date(periodStartMs) : new Date(rangeEnd.getTime() - 30 * 24 * 3600 * 1000);
    rangeStart.setHours(0, 0, 0, 0);
    if (allTransactions.length > 0 && account) {
      let total = allTransactions.filter(
        (tra) => tra.account?._id === account._id && tra.isReadable
      );
      total = total.filter((tra) => {
        const transactionDate = new Date((tra.date || tra.createdAt) as string | number | Date);
        return transactionDate >= rangeStart && transactionDate <= rangeEnd;
      });
      const accBills = total.filter((bill) => bill.isBill);
      const accIncomes = total.filter((bill) => bill.isIncome);
      // These totals are displayed labeled as the Wallet's primary currency
      // (formatMoneyMajor(..., walletPrimaryCurrency) below), so they must
      // be summed in that currency too - raw tra.amount is in the
      // transaction's own native currency, which only happens to equal the
      // Wallet primary for an all-MXN wallet.

      const finalBill = accBills.reduce(
        (currentVal, bill) => currentVal + getPrimaryAmount(bill),
        0
      );
      const finalIncome = accIncomes.reduce(
        (currentVal, income) => currentVal + getPrimaryAmount(income),
        0
      );
      // Native-currency sums (e.g. USD for a Revolut account) - shown as the
      // primary number for a foreign-currency account, with the wallet-
      // primary total above as the small converted equivalent.
      const nativeBill = accBills.reduce(
        (currentVal, bill) => currentVal + getNativeAmount(bill),
        0
      );
      const nativeIncome = accIncomes.reduce(
        (currentVal, income) => currentVal + getNativeAmount(income),
        0
      );
      setTotalReadTransactions(total);
      setBillTransactions(accBills);
      setIncomeTransactions(accIncomes);

      setTotalBill(finalBill);
      setTotalIncome(finalIncome);
      setNativeTotalBill(nativeBill);
      setNativeTotalIncome(nativeIncome);
    }
  }, [allTransactions, account, periodStartMs, periodEndMs]);

  // Current-equivalent: a live valuation of this Account's native balance in
  // the Wallet's primary currency, not a second bank balance. Never shown
  // when a quote isn't available - no fake rate-1 fallback.
  useEffect(() => {
    setEquivalentQuote(null);
    if (!account?._id || !walletPrimaryCurrency) return;
    if (accountCurrency === walletPrimaryCurrency) return;
    if (demoRatesToMxn) return;

    let cancelled = false;
    const toFetch = fetcher();
    (async () => {
      try {
        const amountMinor = majorToMinor(account.amount || 0, accountCurrency);
        const res = await toFetch.post("general-data/fx/quote", {
          amountMinor,
          fromCurrency: accountCurrency,
          toCurrency: walletPrimaryCurrency,
        });
        if (!cancelled && res.ok) {
          setEquivalentQuote(res.data);
        }
      } catch {
        // Silently unavailable - the card just omits the equivalent line.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account?._id, account?.amount, accountCurrency, walletPrimaryCurrency, demoRatesToMxn]);

  const isForeignAccount = accountCurrency !== walletPrimaryCurrency;

  // The card shows the account as the phone does: its saved color and pattern, the balance, the number and what came in and
  // went out in the period. The period is chosen right under it, not on the card.
  const incomeValue = isForeignAccount ? nativeTotalIncome : totalIncome;
  const spendingValue = isForeignAccount ? nativeTotalBill : totalBill;
  const demoRate = demoRatesToMxn?.[accountCurrency];
  const primaryRate = demoRatesToMxn?.[walletPrimaryCurrency];
  const demoEquivalent = demoRate && primaryRate
    ? ((Number(account?.amount) || 0) * demoRate) / primaryRate
    : null;
  const equivalentText = demoEquivalent !== null
    ? `≈ ${formatMoneyMinor(majorToMinor(demoEquivalent, walletPrimaryCurrency), walletPrimaryCurrency, { showCode: false })} ${walletPrimaryCurrency}`
    : equivalentQuote
      ? `≈ ${formatMoneyMinor(equivalentQuote.amountMinor as number, equivalentQuote.currency as string, { showCode: false })} ${equivalentQuote.currency}`
      : null;
  const savedAccount = account as CreditCardAccountRef & { accountType?: string | null; cardColor?: string | null; cardPattern?: string | null };

  return (
    <div className="pulse-animation-short h-full shrink-0">
      <AccountCardFace
        seed={String(account?._id ?? account?.name ?? "")}
        name={account?.name}
        bankId={account?.bankId}
        accountType={savedAccount.accountType}
        cardNumber={account?.cardNumber}
        cardColor={savedAccount.cardColor}
        cardPattern={savedAccount.cardPattern}
        currency={accountCurrency}
        balance={Number(account?.amount) || 0}
        equivalent={equivalentText}
        incomes={incomeValue}
        spending={spendingValue}
        flowCurrency={isForeignAccount ? accountCurrency : walletPrimaryCurrency}
        onOpen={!readOnly ? () => {
          if (account?._id) router.push(`/dashboard/accounts?accountId=${account._id}`);
        } : undefined}
      />
    </div>
  );
}

export default CreditCard;
