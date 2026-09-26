import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import Transaction, { type IReportingMoney } from "@/model/Transaction";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { minorToMajor } from "@/lib/money/currencies";
import { deriveEffectiveRate } from "@/lib/money/conversion";
import { buildSameCurrencyReportingMoney } from "@/lib/money/transactionMoney";
import { convert } from "@/lib/money/server/fxRateService";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";

export const transferTransactionSchema = z
  .object({
    user: z.unknown().optional(),
    wallet: z.unknown().optional(),
    name: z.string().optional().nullable(),
    kind: z.enum(["transfer", "exchange"]).or(z.string()).optional().nullable(),
    sourceAccountId: z.string().optional().nullable(),
    sourceAmountMinor: z.number().optional().nullable(),
    destinationAccountId: z.string().optional().nullable(),
    destinationAmountMinor: z.number().optional().nullable(),
    date: z.union([z.string(), z.date()]).optional().nullable(),
  })
  .passthrough();

export type TransferTransactionRequestBody = z.infer<
  typeof transferTransactionSchema
>;

export interface TransferTransactionSuccessResponse {
  message: string;
  data: {
    outgoing: unknown;
    incoming: unknown;
    transferGroupId: string;
    effectiveRate: string;
  };
  status: number;
  ok: true;
}

export interface TransferTransactionErrorResponse {
  ok: false;
  message: string;
}

export type TransferTransactionResponse =
  | TransferTransactionSuccessResponse
  | TransferTransactionErrorResponse;

// Internal transfers/exchanges are not income or spending (plan section
// 2.6): two linked Transaction legs, created atomically inside one MongoDB
// session so the app can never end up with only one leg on a crash/error.
async function buildLegReporting(
  accountCurrency: string,
  accountAmountMinor: number,
  walletPrimaryCurrency: string,
  date: Date
): Promise<IReportingMoney> {
  if (accountCurrency === walletPrimaryCurrency) {
    return buildSameCurrencyReportingMoney({
      accountMoney: { amountMinor: accountAmountMinor, currency: accountCurrency },
      effectiveDate: date,
    });
  }
  const quote = (await convert({
    amountMinor: accountAmountMinor,
    fromCurrency: accountCurrency,
    toCurrency: walletPrimaryCurrency,
    date,
  })) as {
    available: boolean;
    amountMinor?: number;
    rate?: string;
    source?: string;
    effectiveDate?: Date;
    estimated?: boolean;
  };
  if (!quote.available) {
    throw new Error(
      `Exchange-rate estimate unavailable for ${accountCurrency} -> ${walletPrimaryCurrency}. Try again in a moment.`
    );
  }
  return {
    amountMinor: quote.amountMinor as number,
    currency: walletPrimaryCurrency,
    rate: quote.rate as string,
    source: quote.source as string,
    effectiveDate: quote.effectiveDate as Date,
    estimated: quote.estimated,
  };
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<TransferTransactionResponse>> {
  try {
    if (!request) throw new Error("No data in request on TRANSFER POST");
    const body = ((await request.json()) || {}) as TransferTransactionRequestBody;
    const {
      name,
      kind, // "transfer" | "exchange"
      sourceAccountId,
      sourceAmountMinor,
      destinationAccountId,
      destinationAmountMinor,
      date,
    } = body;

    // Security fix: this route previously lacked session verification and
    // trusted caller-supplied user/wallet parameters (or created transactions
    // with unverified ownership). We now verify the caller's session via
    // auth.api.getSession, find the session user in the database, and derive
    // user and wallet directly from the session.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    if (!sourceAccountId || !destinationAccountId)
      throw new Error("Both source and destination Accounts are required");
    if (String(sourceAccountId) === String(destinationAccountId))
      throw new Error("Source and destination Accounts must be different");
    if (!Number.isInteger(sourceAmountMinor) || (sourceAmountMinor as number) <= 0)
      throw new Error("sourceAmountMinor must be a positive integer");
    if (!Number.isInteger(destinationAmountMinor) || (destinationAmountMinor as number) <= 0)
      throw new Error("destinationAmountMinor must be a positive integer");

    const validSourceAmountMinor = sourceAmountMinor as number;
    const validDestinationAmountMinor = destinationAmountMinor as number;

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found on TRANSFER TRANSACTION");

    const [sourceAccount, destinationAccount, parentWallet] = await Promise.all([
      Account.findById(sourceAccountId).lean(),
      Account.findById(destinationAccountId).lean(),
      (
        Wallet as unknown as {
          findById: (walletId: unknown) => {
            lean: () => Promise<{ primaryCurrency?: string } | null>;
          };
        }
      )
        .findById(userFound.wallet)
        .lean(),
    ]);
    if (!sourceAccount || String(sourceAccount.user) !== String(userFound._id) || String(sourceAccount.wallet) !== String(userFound.wallet)) {
      throw new Error("Source Account not found or does not belong to this user/Wallet");
    }
    if (!destinationAccount || String(destinationAccount.user) !== String(userFound._id) || String(destinationAccount.wallet) !== String(userFound.wallet)) {
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
            sourceMoney: { amountMinor: validSourceAmountMinor, currency: sourceCurrency },
            targetMoney: { amountMinor: validDestinationAmountMinor, currency: destinationCurrency },
          });

    const [sourceReporting, destinationReporting] = await Promise.all([
      buildLegReporting(sourceCurrency, validSourceAmountMinor, walletPrimaryCurrency, parsedDate),
      buildLegReporting(destinationCurrency, validDestinationAmountMinor, walletPrimaryCurrency, parsedDate),
    ]);

    const session = await mongoose.startSession();
    let outgoingId: mongoose.Types.ObjectId | undefined;
    let incomingId: mongoose.Types.ObjectId | undefined;
    try {
      await session.withTransaction(async () => {
        const outgoing = new Transaction({
          user: userFound._id,
          wallet: userFound.wallet,
          name: legName,
          amount: minorToMajor(validSourceAmountMinor, sourceCurrency),
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
            account: { amountMinor: validSourceAmountMinor, currency: sourceCurrency },
            merchant: null,
            reporting: sourceReporting,
          },
        });
        const incoming = new Transaction({
          user: userFound._id,
          wallet: userFound.wallet,
          name: legName,
          amount: minorToMajor(validDestinationAmountMinor, destinationCurrency),
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
            account: { amountMinor: validDestinationAmountMinor, currency: destinationCurrency },
            merchant: null,
            reporting: destinationReporting,
          },
        });
        await outgoing.save({ session });
        await incoming.save({ session });
        outgoingId = outgoing._id as mongoose.Types.ObjectId;
        incomingId = incoming._id as mongoose.Types.ObjectId;
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
    return NextResponse.json(
      { ok: false, message: (e as Error)?.message || "Unexpected error" },
      { status: 400 }
    );
  }
}
