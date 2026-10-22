import dbConnection from "@/app/api/dbConnection";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type mongoose from "mongoose";
import Transaction from "@/model/Transaction";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";
import Category from "@/model/Category";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { assertOwnedOrDefault } from "@/lib/auth/ownership";
import { majorToMinor, minorToMajor } from "@gastify/core/money/currencies";
import { planCurrencyChange } from "@gastify/core/money/currencyChange";
import { convert } from "@/lib/money/server/fxRateService";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { attachDisplayMoney } from "@/lib/money/server/transactionReadService";

// Not exported: a Next.js route file may only export handlers. Kept as the source of the request-body type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const editManyTransactionsSchema = z
  .object({
    transactions: z.array(z.string()).optional().nullable(),
    fields: z.array(z.string()).optional().nullable(), // array of field names to update, e.g. ["name"] or ["category","subCategory"]
    name: z.string().optional().nullable(),
    amount: z.union([z.number(), z.string()]).optional().nullable(),
    isIncome: z.boolean().optional().nullable(),
    isBill: z.boolean().optional().nullable(),
    isReadable: z.boolean().optional().nullable(),
    date: z.union([z.string(), z.date()]).optional().nullable(),
    account: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    subCategory: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
  })
  .passthrough();

export type EditManyTransactionsRequestBody = z.infer<typeof editManyTransactionsSchema>;

export interface EditManyTransactionsSuccessResponse {
  message: string;
  data: unknown[];
  status: number;
  ok: true;
}

export interface EditManyTransactionsErrorResponse {
  ok: false;
  message: string;
}

export type EditManyTransactionsResponse =
  | EditManyTransactionsSuccessResponse
  | EditManyTransactionsErrorResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<EditManyTransactionsResponse>> {
  try {
    if (!request) throw new Error("No data in request on Update Many Trans");
    const body = ((await request.json()) || {}) as EditManyTransactionsRequestBody;
    const {
      transactions,
      fields, // array of field names to update, e.g. ["name"] or ["category","subCategory"]
      name,
      amount,
      isIncome,
      isBill,
      isReadable,
      date,
      account,
      category,
      subCategory,
      tags,
    } = body;
    // The new currency for the "currency" field (only used when that field is targeted).
    const targetCurrency = typeof (body as { currency?: unknown }).currency === "string" ? String((body as { currency?: unknown }).currency) : "";

    // Security fix: this route previously lacked session verification and
    // performed Transaction.findById / Transaction.save directly with zero ownership check.
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and scope transaction and account lookups to the
    // user's wallet.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error("No session");

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found on EDIT MANY TRANSACTIONS");

    const userWallet = userFound.wallet;

    if (!transactions || transactions.length === 0)
      throw new Error("No transaction IDs passed to edit-many");

    // If no fields array provided fall back to updating all truthy values (legacy behaviour)
    const targeted = Array.isArray(fields) && fields.length > 0;
    const shouldUpdate = (field: string) => !targeted || fields.includes(field);

    const walletCache = new Map<string, { primaryCurrency?: string; [key: string]: unknown } | null>();
    async function getWalletCached(walletId: unknown) {
      const key = String(walletId);
      if (!walletCache.has(key)) {
        const found = (await (
          Wallet as unknown as {
            findById: (id: unknown) => {
              lean: () => Promise<{ primaryCurrency?: string; [key: string]: unknown } | null>;
            };
          }
        )
          .findById(walletId)
          .lean()) as { primaryCurrency?: string; [key: string]: unknown } | null;
        walletCache.set(key, found);
      }
      return walletCache.get(key);
    }

    // Bulk Account reassignment is only safe automatically when every
    // selected Transaction already shares the destination Account's
    // currency - a mixed-currency bulk move requires per-Transaction
    // conversion strategy (handled individually, not in bulk). Validate
    // this up front so the action either fully applies or is fully blocked.
    if (shouldUpdate("account") && account) {
      const destinationAccount = await Account.findOne({ _id: account, wallet: userWallet }).lean();
      if (!destinationAccount) throw new Error("Destination account not found for bulk account reassignment");
      const destCurrency = destinationAccount.currency || "MXN";

      for (const transId of transactions) {
        const t = await Transaction.findOne({ _id: transId, wallet: userWallet }).lean();
        if (!t) throw new Error(`Transaction ${transId} not found`);
        const w = await getWalletCached(t.wallet);
        const tCurrency = t.money?.account?.currency || w?.primaryCurrency || "MXN";
        if (tCurrency !== destCurrency) {
          throw new Error(
            `Bulk account reassignment blocked: destination Account is ${destCurrency} but at least one selected Transaction is ${tCurrency}. Reassign mismatched-currency transactions individually instead.`
          );
        }
      }
    }

    const savedTrans: unknown[] = [];
    // Movements that could not change currency, with the reason: they are reported, not failed.
    const skipped: { id: string; name: string; accountCurrency: string; reason: string }[] = [];

    for (const transId of transactions) {
      const transaction = await Transaction.findOne({ _id: transId, wallet: userWallet });
      if (!transaction) throw new Error(`Transaction ${transId} not found`);

      const parentWallet = await getWalletCached(transaction.wallet);
      const currentAccountCurrency = transaction.money?.account?.currency || parentWallet?.primaryCurrency || "MXN";
      const amountTouched = shouldUpdate("amount") && amount !== undefined && amount !== "" && amount !== null;
      const accountTouched = shouldUpdate("account");
      const dateTouched = shouldUpdate("date") && Boolean(date);

      // Currency: the amount is converted with the rate of the movement's date, and the movement goes to the destination
      // account (chosen in the change) only when that account is in the new currency. Movements with no account convert
      // directly. Anything else is reported in "skipped" and left as it was.
      let currencyDone = false;
      if (shouldUpdate("currency") && targetCurrency) {
        const destination = accountTouched && account ? await Account.findOne({ _id: account, wallet: userWallet }).lean() : null;
        const ownAccount = transaction.account ? await Account.findOne({ _id: transaction.account, wallet: userWallet }).lean() : null;
        const plan = planCurrencyChange(
          [{ id: String(transaction._id), name: transaction.name || "Movimiento", accountCurrency: ownAccount?.currency ?? null }],
          targetCurrency,
          destination ? { id: String(destination._id), currency: destination.currency || "MXN" } : null
        );
        if (plan.blocked.length > 0) {
          skipped.push({ id: String(transaction._id), name: transaction.name || "Movimiento", accountCurrency: plan.blocked[0].accountCurrency, reason: plan.blocked[0].reason });
          continue;
        }
        const fromCurrency = currentAccountCurrency;
        if (fromCurrency !== targetCurrency) {
          const currentAmount = transaction.money?.account
            ? minorToMajor(transaction.money.account.amountMinor, transaction.money.account.currency)
            : Number(transaction.amount) || 0;
          const converted = await convert({ amountMinor: majorToMinor(currentAmount, fromCurrency), fromCurrency, toCurrency: targetCurrency, date: transaction.date });
          if (!converted.available) {
            skipped.push({ id: String(transaction._id), name: transaction.name || "Movimiento", accountCurrency: fromCurrency, reason: "No hay tipo de cambio para la fecha de este movimiento." });
            continue;
          }
          const newAmount = minorToMajor(converted.amountMinor, targetCurrency);
          transaction.amount = newAmount;
          transaction.money = await buildTransactionMoney({
            accountAmount: newAmount,
            accountCurrency: targetCurrency,
            merchantAmount: undefined,
            merchantCurrency: undefined,
            walletPrimaryCurrency: parentWallet?.primaryCurrency || "MXN",
            date: transaction.date,
            manualReportingAmount: undefined,
          });
        }
        if (destination) transaction.account = destination._id as mongoose.Types.ObjectId;
        currencyDone = true;
      }

      if (shouldUpdate("name") && name !== undefined && name !== "" && name !== null)
        transaction.name = name;

      if (amountTouched) transaction.amount = Number(amount);

      if (shouldUpdate("isIncome") || shouldUpdate("isBill")) {
        if (isIncome !== undefined && isIncome !== null) transaction.isIncome = isIncome;
        if (isBill !== undefined && isBill !== null) transaction.isBill = isBill;
      }

      if (shouldUpdate("isReadable") && isReadable !== undefined && isReadable !== null)
        transaction.isReadable = isReadable;

      if (dateTouched && date)
        transaction.date = new Date(date);

      if (accountTouched)
        transaction.account = (account as unknown as mongoose.Types.ObjectId) || undefined;

      if (!currencyDone && (amountTouched || accountTouched || dateTouched)) {
        // Already validated same-currency above when the Account changes,
        // so no per-transaction conversion strategy is needed here.
        const nextAccountCurrency = accountTouched
          ? (account ? (await Account.findOne({ _id: account, wallet: userWallet }).lean())?.currency || parentWallet?.primaryCurrency || "MXN" : parentWallet?.primaryCurrency || "MXN")
          : currentAccountCurrency;
        const resolvedAmount = amountTouched
          ? Number(amount)
          : transaction.money?.account
          ? minorToMajor(transaction.money.account.amountMinor, transaction.money.account.currency)
          : transaction.amount;

        transaction.amount = resolvedAmount;
        transaction.money = await buildTransactionMoney({
          accountAmount: resolvedAmount,
          accountCurrency: nextAccountCurrency,
          merchantAmount: undefined,
          merchantCurrency: undefined,
          walletPrimaryCurrency: parentWallet?.primaryCurrency || "MXN",
          date: transaction.date,
          manualReportingAmount: undefined,
        });
      }

      transaction.kind = transaction.isIncome ? "income" : "expense";
      transaction.direction = transaction.isIncome ? "credit" : "debit";

      // Category / subcategory
      if (shouldUpdate("subCategory") && subCategory) {
        const foundSub = await SubCategory.findById(subCategory);
        assertOwnedOrDefault(foundSub, userFound._id, userWallet, "SubCategory not found at edit-many", "isDefaultSubCatego");
        transaction.subCategory = foundSub._id as mongoose.Types.ObjectId;
        transaction.category = foundSub.fatherCategory as mongoose.Types.ObjectId;
      } else if (shouldUpdate("category") && category && !subCategory) {
        const foundCategory = await Category.findById(category).lean();
        assertOwnedOrDefault(foundCategory, userFound._id, userWallet, "Category not found at edit-many", "isDefaultCatego");
        transaction.category = foundCategory._id as mongoose.Types.ObjectId;
        if (shouldUpdate("subCategory")) transaction.subCategory = undefined;
      }

      // Tags — only update if field is targeted or tags array is provided
      if (shouldUpdate("tags") && Array.isArray(tags)) {
        const newTags: mongoose.Types.ObjectId[] = [];
        for (const tagName of tags.filter(Boolean)) {
          let found = await Tag.findOne({ name: tagName, user: transaction.user });
          if (!found) {
            found = await Tag.create({ name: tagName, user: transaction.user, wallet: userWallet });
          }
          newTags.push(found._id as mongoose.Types.ObjectId);
        }
        transaction.tags = newTags;
      }

      const updated = await transaction.save();
      const populated = await Transaction.findById(updated._id)
        .populate("tags")
        .populate("account")
        .populate("category")
        .populate("subCategory")
        .lean();

      const withDisplayMoney = await attachDisplayMoney(populated, parentWallet?.primaryCurrency || "MXN");
      savedTrans.push(withDisplayMoney);
    }

    return NextResponse.json({
      message: `${savedTrans.length} transaction(s) updated successfully 😎`,
      data: savedTrans,
      skipped,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.error("edit-many error:", e);
    return NextResponse.json(
      { ok: false, message: (e as Error)?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
