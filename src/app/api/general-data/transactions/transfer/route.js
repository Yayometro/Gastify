import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import { minorToMajor } from "@/lib/money/currencies";
import { deriveEffectiveRate } from "@/lib/money/conversion";
import { buildSameCurrencyReportingMoney } from "@/lib/money/transactionMoney";
import { convert } from "@/lib/money/server/fxRateService";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";

// Internal transfers/exchanges are not income or spending (plan section
// 2.6): two linked Transaction legs, created atomically inside one MongoDB
// session so the app can never end up with only one leg on a crash/error.
async function buildLegReporting(accountCurrency, accountAmountMinor, walletPrimaryCurrency, date) {
  if (accountCurrency === walletPrimaryCurrency) {
    return buildSameCurrencyReportingMoney({
      accountMoney: { amountMinor: accountAmountMinor, currency: accountCurrency },
      effectiveDate: date,
    });
  }
  const quote = await convert({
    amountMinor: accountAmountMinor,
    fromCurrency: accountCurrency,
    toCurrency: walletPrimaryCurrency,
    date,
  });
  if (!quote.available) {
    throw new Error(
      `Exchange-rate estimate unavailable for ${accountCurrency} -> ${walletPrimaryCurrency}. Try again in a moment.`
    );
  }
  return {
    amountMinor: quote.amountMinor,
    currency: walletPrimaryCurrency,
    rate: quote.rate,
    source: quote.source,
    effectiveDate: quote.effectiveDate,
    estimated: quote.estimated,
  };
}

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on TRANSFER POST");
    const {
      user,
      wallet,
      name,
      kind, // "transfer" | "exchange"
      sourceAccountId,
      sourceAmountMinor,
      destinationAccountId,
      destinationAmountMinor,
      date,
    } = await request.json();

    if (!user) throw new Error("No User ID provided for transfer/exchange");
    if (!wallet) throw new Error("No Wallet ID provided for transfer/exchange");
    if (!sourceAccountId || !destinationAccountId)
      throw new Error("Both source and destination Accounts are required");
    if (String(sourceAccountId) === String(destinationAccountId))
      throw new Error("Source and destination Accounts must be different");
    if (!Number.isInteger(sourceAmountMinor) || sourceAmountMinor <= 0)
      throw new Error("sourceAmountMinor must be a positive integer");
    if (!Number.isInteger(destinationAmountMinor) || destinationAmountMinor <= 0)
      throw new Error("destinationAmountMinor must be a positive integer");

    await dbConnection();

    const [sourceAccount, destinationAccount, parentWallet] = await Promise.all([
      Account.findById(sourceAccountId).lean(),
      Account.findById(destinationAccountId).lean(),
      Wallet.findById(wallet).lean(),
    ]);
    if (!sourceAccount || String(sourceAccount.user) !== String(user) || String(sourceAccount.wallet) !== String(wallet)) {
      throw new Error("Source Account not found or does not belong to this user/Wallet");
    }
    if (!destinationAccount || String(destinationAccount.user) !== String(user) || String(destinationAccount.wallet) !== String(wallet)) {
      throw new Error("Destination Account not found or does not belong to this user/Wallet");
    }
    if (!parentWallet) throw new Error("Wallet not found for transfer/exchange");

    // .lean() never applies schema defaults - a real Account/Wallet document
    // that predates the multi-currency migration has no currency/
    // primaryCurrency field in its stored BSON at all.
    const sourceCurrency = sourceAccount.currency || "MXN";
    const destinationCurrency = destinationAccount.currency || "MXN";
    const walletPrimaryCurrency = parentWallet.primaryCurrency || "MXN";

    const resolvedKind = kind === "exchange" ? "exchange" : "transfer";
    if (resolvedKind === "transfer" && sourceCurrency !== destinationCurrency) {
      throw new Error(
        "A transfer requires both Accounts to share the same currency - use an exchange for cross-currency moves"
      );
    }

    const parsedDate = date ? new Date(date) : new Date();
    const transferGroupId = new mongoose.Types.ObjectId().toString();
    const legName = name?.trim() || (resolvedKind === "exchange" ? "Currency exchange" : "Transfer between accounts");

    // The exact rate actually used, derived from the two real amounts
    // entered (not looked up) - stored for audit even though it isn't
    // written onto either leg's reporting money directly.
    const effectiveRate =
      sourceCurrency === destinationCurrency
        ? "1"
        : deriveEffectiveRate({
            sourceMoney: { amountMinor: sourceAmountMinor, currency: sourceCurrency },
            targetMoney: { amountMinor: destinationAmountMinor, currency: destinationCurrency },
          });

    const [sourceReporting, destinationReporting] = await Promise.all([
      buildLegReporting(sourceCurrency, sourceAmountMinor, walletPrimaryCurrency, parsedDate),
      buildLegReporting(destinationCurrency, destinationAmountMinor, walletPrimaryCurrency, parsedDate),
    ]);

    const session = await mongoose.startSession();
    let outgoingId;
    let incomingId;
    try {
      await session.withTransaction(async () => {
        const outgoing = new Transaction({
          user,
          wallet,
          name: legName,
          amount: minorToMajor(sourceAmountMinor, sourceCurrency),
          isBill: false,
          isIncome: false,
          isReadable: true,
          date: parsedDate,
          account: sourceAccountId,
          kind: resolvedKind,
          direction: "debit",
          transferGroupId,
          transferDirection: "out",
          money: {
            account: { amountMinor: sourceAmountMinor, currency: sourceCurrency },
            merchant: null,
            reporting: sourceReporting,
          },
        });
        const incoming = new Transaction({
          user,
          wallet,
          name: legName,
          amount: minorToMajor(destinationAmountMinor, destinationCurrency),
          isBill: false,
          isIncome: false,
          isReadable: true,
          date: parsedDate,
          account: destinationAccountId,
          kind: resolvedKind,
          direction: "credit",
          transferGroupId,
          transferDirection: "in",
          money: {
            account: { amountMinor: destinationAmountMinor, currency: destinationCurrency },
            merchant: null,
            reporting: destinationReporting,
          },
        });
        await outgoing.save({ session });
        await incoming.save({ session });
        outgoingId = outgoing._id;
        incomingId = incoming._id;
      });
    } finally {
      await session.endSession();
    }

    const [outgoingLoaded, incomingLoaded] = await Promise.all([
      Transaction.findById(outgoingId).populate("account").lean(),
      Transaction.findById(incomingId).populate("account").lean(),
    ]);
    const [outgoingWithDisplayMoney, incomingWithDisplayMoney] = await attachDisplayMoneyToList(
      [outgoingLoaded, incomingLoaded],
      walletPrimaryCurrency
    );

    return NextResponse.json({
      message: `${legName} recorded successfully`,
      data: { outgoing: outgoingWithDisplayMoney, incoming: incomingWithDisplayMoney, transferGroupId, effectiveRate },
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ ok: false, message: e?.message || "Unexpected error" }, { status: 400 });
  }
}
