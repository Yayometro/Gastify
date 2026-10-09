import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type mongoose from "mongoose";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Transaction, { type ITransactionMoney } from "@/model/Transaction";
import Tag from "@/model/Tag";
import Account from "@/model/Account";
import SubCategory from "@/model/SubCategory";
import "@/model/Category";
import Budget from "@/model/Budget";
import Wallet from "@/model/Wallet";
import { minorToMajor } from "@/lib/money/currencies";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { buildMerchantMoney } from "@/lib/money/transactionMoney";
import { convert } from "@/lib/money/server/fxRateService";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";
import { auth } from "@/lib/auth/betterAuth";

// Not exported: a Next.js route file may only export handlers. Kept as the source of the request-body type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateTransactionSchema = z
  .object({
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
    budget: z.string().optional().nullable(),
    merchantAmount: z.union([z.number(), z.string()]).optional().nullable(),
    merchantCurrency: z.string().optional().nullable(),
    manualReportingAmount: z.union([z.number(), z.string()]).optional().nullable(),
    // Required only when reassigning to an Account in a different
    // currency: "convert" (preserve reporting value), "reinterpret" (keep
    // the number, relabel currency), or "manual" (caller supplies `amount`
    // explicitly in the new currency). The server never infers this.
    currencyStrategy: z.string().optional().nullable(),
  })
  .passthrough();

export type UpdateTransactionRequestBody = z.infer<typeof updateTransactionSchema>;

export interface UpdateTransactionSuccessResponse {
  message: string;
  data: unknown;
  status: number;
  ok: boolean;
}

export type UpdateTransactionResponse = UpdateTransactionSuccessResponse;

export async function POST(
  request: NextRequest | Request,
  context: { params: Promise<{ id?: string }> }
): Promise<NextResponse<UpdateTransactionResponse>> {
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    const {
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
      budget,
      merchantAmount,
      merchantCurrency,
      manualReportingAmount,
      currencyStrategy,
    } = ((await request.json()) || {}) as UpdateTransactionRequestBody;

    // Validators
    if (!context || !context.params)
      throw new Error("No params ID send to work on POST UPDATE TRANSACTION");
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    if (!id)
      throw new Error("No params ID send to work on POST UPDATE TRANSACTION");

    // Security fix: this route previously lacked session verification and
    // performed Transaction.findById(params.id) directly with zero ownership check.
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and scope the transaction lookup to the
    // user's wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found on UPDATE TRANSACTION");

    const findTrans = await Transaction.findOne({
      _id: id,
      wallet: userFound.wallet,
    });

    if (!findTrans)
      throw new Error("No Transactions found work on POST UPDATE TRANSACTION");

    // Structural typing with unknown avoids any while resolving TS2349 union incompatibility on unmigrated Wallet.js
    const parentWallet = (await (
      Wallet as unknown as {
        findById: (walletId: unknown) => {
          lean: () => Promise<{ primaryCurrency?: string } | null>;
        };
      }
    )
      .findById(findTrans.wallet)
      .lean()) as { primaryCurrency?: string } | null;
    if (!parentWallet) throw new Error("No Wallet found for this Transaction");
    // .lean() never applies schema defaults - a real Wallet/Account document
    // that predates the multi-currency migration has no primaryCurrency/
    // currency field in its stored BSON at all.
    const walletPrimaryCurrency = parentWallet.primaryCurrency || "MXN";

    const currentAccountCurrency =
      findTrans.money?.account?.currency || walletPrimaryCurrency;
    const accountChanged =
      account !== undefined &&
      String(account || "") !== String(findTrans.account || "");
    const amountProvided = amount !== undefined && amount !== "" && amount !== null;

    let nextAccount = findTrans.account;
    let nextAccountCurrency = currentAccountCurrency;
    let resolvedAmount: number | undefined = amountProvided
      ? Number(amount)
      : findTrans.money?.account
      ? minorToMajor(
          findTrans.money.account.amountMinor,
          findTrans.money.account.currency
        )
      : findTrans.amount;

    if (accountChanged) {
      nextAccount = account ? (account as unknown as mongoose.Types.ObjectId) : null;
      const newAccountDoc = nextAccount
        ? await Account.findById(nextAccount).lean()
        : null;
      nextAccountCurrency = newAccountDoc?.currency || walletPrimaryCurrency;

      if (nextAccountCurrency !== currentAccountCurrency) {
        if (!currencyStrategy) {
          throw new Error(
            `Changing to an Account in a different currency (${currentAccountCurrency} -> ${nextAccountCurrency}) requires an explicit choice: convert, reinterpret, or manual.`
          );
        }
        if (currencyStrategy === "reinterpret") {
          // Keep the same number, just relabel the currency - resolvedAmount
          // already defaults to the current native major amount above.
        } else if (currencyStrategy === "manual") {
          if (!amountProvided)
            throw new Error(
              "The manual currency strategy requires an explicit amount in the new Account's currency"
            );
        } else if (currencyStrategy === "convert") {
          const sourceMinor =
            findTrans.money?.account?.amountMinor ??
            Math.round((findTrans.amount || 0) * 100);
          const quote = await convert({
            amountMinor: sourceMinor,
            fromCurrency: currentAccountCurrency,
            toCurrency: nextAccountCurrency,
            date: findTrans.date,
          });
          if (!quote.available) {
            throw new Error(
              `Exchange-rate estimate unavailable to convert ${currentAccountCurrency} -> ${nextAccountCurrency}. Try again in a moment.`
            );
          }
          resolvedAmount = minorToMajor(quote.amountMinor, nextAccountCurrency);
        } else {
          throw new Error(`Unknown currencyStrategy: ${currencyStrategy}`);
        }
      }
    }

    const dateChanged =
      date !== undefined &&
      date !== null &&
      date !== "" &&
      new Date(date).getTime() !== new Date(findTrans.date).getTime();
    const parsedDate = dateChanged && date ? new Date(date) : findTrans.date;

    // Preserve an existing exact manual/provider reporting snapshot when
    // nothing monetary about this edit actually changed - do not silently
    // discard an exact value in favor of a re-estimated one (plan section 9.1).
    const existingReporting = findTrans.money?.reporting;
    const accountCurrencyChanged =
      accountChanged && nextAccountCurrency !== currentAccountCurrency;
    const canPreserveExistingReporting =
      !amountProvided &&
      !accountCurrencyChanged &&
      !dateChanged &&
      manualReportingAmount === undefined &&
      existingReporting &&
      ["manual", "provider_import", "revolut"].includes(existingReporting.source);

    let money: ITransactionMoney;
    if (canPreserveExistingReporting) {
      money = {
        account: {
          amountMinor: findTrans.money.account.amountMinor,
          currency: findTrans.money.account.currency,
        },
        merchant: findTrans.money?.merchant || null,
        reporting: existingReporting,
      };
    } else {
      money = await buildTransactionMoney({
        accountAmount: resolvedAmount,
        accountCurrency: nextAccountCurrency,
        merchantAmount:
          merchantAmount !== undefined &&
          merchantAmount !== null &&
          merchantAmount !== ""
            ? Number(merchantAmount)
            : merchantAmount,
        merchantCurrency: merchantCurrency ?? undefined,
        walletPrimaryCurrency,
        date: parsedDate,
        manualReportingAmount:
          manualReportingAmount !== undefined &&
          manualReportingAmount !== null &&
          manualReportingAmount !== ""
            ? Number(manualReportingAmount)
            : manualReportingAmount,
      });
    }
    // merchantAmount undefined = the client never sent this field at all
    // (e.g. every other edit form) - keep whatever merchant money already
    // existed. merchantAmount present (a real value, or explicit null/""
    // to clear it) always wins and is recomputed, even when the reporting
    // snapshot above was otherwise preserved untouched.
    if (merchantAmount === undefined) {
      if (findTrans.money?.merchant) money.merchant = findTrans.money.merchant;
    } else {
      money.merchant = buildMerchantMoney({
        amount:
          merchantAmount !== null && merchantAmount !== ""
            ? Number(merchantAmount)
            : merchantAmount,
        currency: merchantCurrency,
      });
    }

    // UPDATES:
    findTrans.name = !name ? findTrans.name : name;
    findTrans.amount = resolvedAmount;
    findTrans.isIncome = !isIncome ? findTrans.isIncome : isIncome;
    findTrans.isBill = !isBill ? findTrans.isBill : isBill;
    findTrans.isReadable = !isReadable ? findTrans.isReadable : isReadable;
    findTrans.date = parsedDate;
    findTrans.account = accountChanged ? nextAccount : findTrans.account;
    findTrans.kind = findTrans.isIncome ? "income" : "expense";
    findTrans.direction = findTrans.isIncome ? "credit" : "debit";
    findTrans.money = money;
    if (budget !== undefined) {
      if (!budget) {
        findTrans.budget = null as unknown as mongoose.Types.ObjectId;
      } else {
        const linkedBudget = await Budget.findOne({
          _id: budget,
          user: findTrans.user,
          wallet: findTrans.wallet,
          archived: { $ne: true },
        });
        if (
          !linkedBudget ||
          (linkedBudget.budgetType ||
            (linkedBudget.isSaving ? "saving" : "spending")) !== "project"
        ) {
          throw new Error("Project budget was not found for this transaction");
        }
        findTrans.budget = linkedBudget._id as mongoose.Types.ObjectId;
      }
    }
    // SUB CCATEGORY UPD
    if (subCategory) {
      if (String(findTrans.subCategory || "") !== String(subCategory || "")) {
        const findSubCategory = await SubCategory.findById(subCategory).lean();

        if (!findSubCategory)
          throw new Error("No SUB-CATEGORY found at UPDATE TRANSACTION");
        findTrans.category = findSubCategory.fatherCategory as mongoose.Types.ObjectId;
        findTrans.subCategory = findSubCategory._id as mongoose.Types.ObjectId;
      }
    }
    // CATEGORY UPDATE
    if (category && !subCategory) {
      findTrans.category = !category
        ? findTrans.category
        : (category as unknown as mongoose.Types.ObjectId);
    }
    // TAGS UPDATE
    if (Array.isArray(tags)) {
      const newTags: (string | mongoose.Types.ObjectId)[] = [];
      for (const tag of tags) {
        const findTag = await Tag.findOne({ name: tag, user: findTrans.user });
        if (!findTag) {
          const newTag = new Tag({
            name: tag,
            user: findTrans.user,
            wallet: findTrans.wallet,
          });
          if (!newTag)
            throw new Error("No tag created on UPDATED TRANSACTION POST");
          newTags.push(newTag._id as mongoose.Types.ObjectId);
          await newTag.save();
        } else {
          newTags.push(findTag._id as mongoose.Types.ObjectId);
        }
      }
      findTrans.tags = newTags as mongoose.Types.ObjectId[];
    }

    // SAVE
    const updatedTrans = await findTrans.save();

    if (!updatedTrans)
      throw new Error("NEW TRANSACTIONS could not be saved on POST");
    const transToSend = await Transaction.findById(updatedTrans._id)
      .populate({
        path: "tags",
      })
      .populate({
        path: "account",
      })
      .populate({
        path: "category",
      })
      .populate({
        path: "subCategory",
      })
      .populate({
        path: "budget",
      })
      .lean();

    if (!transToSend)
      throw new Error(
        "Updated transaction -transToSend- could not be loaded to send"
      );
    const [transactionWithDisplayMoney] = await attachDisplayMoneyToList(
      [transToSend],
      walletPrimaryCurrency
    );
    return NextResponse.json({
      message: `${
        updatedTrans.name ? updatedTrans.name : "Transacion"
      } was updated successfully 😎`,
      data: transactionWithDisplayMoney,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as string);
  }
}
