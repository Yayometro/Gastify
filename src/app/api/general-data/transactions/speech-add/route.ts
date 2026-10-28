import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type mongoose from "mongoose";
import dbConnection from "@/app/api/dbConnection";
import Transaction, { type ITransactionMoney } from "@/model/Transaction";
import Category from "@/model/Category";
import User from "@/model/User";
import Account from "@/model/Account";
import "@/model/SubCategory";
import "@/model/Tag";
import Wallet from "@/model/Wallet";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

// Not exported: a Next.js route file may only export handlers. Kept as the source of the request-body type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const speechAddSchema = z
  .object({
    text: z.string().optional().default(""),
    lang: z.string().optional(),
    user: z.unknown().optional(),
  })
  .passthrough();

export type SpeechAddRequestBody = z.infer<typeof speechAddSchema>;

export interface SpeechAddSuccessResponse {
  message: string;
  data: unknown;
  status: number;
  ok: boolean;
}

export type SpeechAddResponse = SpeechAddSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<SpeechAddResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on"));
    const transObj = ((await request.json()) || {}) as SpeechAddRequestBody;

    // Security fix: this route previously lacked session verification and trusted
    // whatever user id was passed in the request body (IDOR), creating transactions
    // in another user's wallet. We now verify the session via auth.api.getSession,
    // find the authenticated user by email, and derive user and wallet directly from the session.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));

    //Variables
    // Title extraction regex
    // let titleRegex =
    //   /(?:title|titulo|name|nombre|descripción|descripcion)[\s:]*["']?([^,"']+)[,"']?/i;
    const titleRegex =
      /(?:title|titulo|name|nombre|descripción|descripcion)[\s:]*["']?([^,"']+?)(?=\s+(?:with|value|amount))/i;

    // Amount extraction regex
    const amountRegex =
      /(?:value|valor|amount|monto|suma|number)\s*of\s*\$?([0-9,]+)/i;
    // Date extraction regex
    const dateRegex =
      /(?:dated\s*(?:on|for)|para\s*el\s*dia|fecha)\s*([A-Za-z]+)\s*([0-9]+)(?:\s*of|de)\s*([0-9]+)/i;
    // Time extraction regex
    const timeRegex = /(?:at|a\s*las)\s*([0-9]+:[0-9]+)\s*(a\.m\.|p\.m\.|am|pm)/i;
    // Category extraction regex
    const categoryRegex =
      /(?:with\s*a|con\s*la)\s*(\w+)\s*(?:category|categoria)/i;
    // Account extraction regex
    const accountRegex = /(?:in\s*the|en\s*la)\s*(\w+)\s*(?:account|cuenta)/i;

    // Extracting data using the regexes:
    const text = transObj.text || "";
    const titleMatch = text.match(titleRegex);
    const amountMatch = text.match(amountRegex);
    const dateMatch = text.match(dateRegex);
    const timeMatch = text.match(timeRegex);
    const categoryMatch = text.match(categoryRegex);
    const accountMatch = text.match(accountRegex);
    //CLG
    //Validating escential data
    if (!titleMatch) {
      throw new Error(t("errors.title.of.transaction.data.is"));
    }
    if (!amountMatch) {
      throw new Error(t("errors.amount.of.transaction.data.is"));
    }

    interface ExtractedTransaction {
      name: string;
      amount: number;
      date: Date;
      category: string | null;
      isBill: boolean;
      isIncome: boolean;
      account: string | null;
    }

    // Constructing the transaction object:
    const transaction: ExtractedTransaction = {
      name: titleMatch ? titleMatch[1] : "Unnamed Transaction",
      amount: amountMatch ? parseInt(amountMatch[1].replace(/,/g, ""), 10) : 0,
      date: new Date(), // Default date: today. This will be overridden if date and time are found.
      category: categoryMatch ? categoryMatch[1] : null,
      isBill: true, // Default to expense. This could be adjusted based on further analysis.
      isIncome: false, // Adjusted based on context.
      account: accountMatch ? accountMatch[1] : null,
    };

    // Adjust the date and time if found:
    if (dateMatch && timeMatch) {
      let hours = parseInt(timeMatch[1].split(":")[0], 10);
      const minutes = parseInt(timeMatch[1].split(":")[1], 10);
      const isPM =
        timeMatch[2].toLowerCase().includes("p.m.") ||
        timeMatch[2].toLowerCase().includes("pm");
      const isAM =
        timeMatch[2].toLowerCase().includes("a.m.") ||
        timeMatch[2].toLowerCase().includes("am");
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      const monthIndex = new Date(dateMatch[1] + " 1, 2000").getMonth(); // Convert month name to number
      transaction.date = new Date(
        `${dateMatch[3]}-${monthIndex + 1}-${
          dateMatch[2]
        } ${hours}:${minutes}:00`
      );
    } else if (dateMatch) {
      const monthIndex = new Date(dateMatch[1] + " 1, 2000").getMonth(); // Convert month name to number without specific time
      transaction.date = new Date(
        `${dateMatch[3]}-${monthIndex + 1}-${dateMatch[2]}`
      );
    }
    // Processing the 'types' to set 'isBill' and 'isIncome' accordingly.
    if (transObj.lang === "English") {
      const typesRegex =
        /(create|new|add|generate) (a|an|one)(.*?) (expense|income|bill|transaction)/i;
      const typesMatch = text.match(typesRegex);
      if (typesMatch) {
        transaction.isBill = /expense|bill/.test(typesMatch[4]);
        transaction.isIncome = /income/.test(typesMatch[4]);
      }
    } else if (transObj.lang === "Spanish") {
      // Integración en español para determinar el tipo de transacción
      const typesRegexSpanish =
        /(crea|agrega|añade|genera) (un|una) (nuevo|nueva) (gasto|ingreso|transacción)/i;
      const typesMatchSpanish = text.match(typesRegexSpanish);
      if (typesMatchSpanish) {
        transaction.isBill = /gasto/.test(typesMatchSpanish[4]);
        transaction.isIncome = /ingreso/.test(typesMatchSpanish[4]);
      }
    }


    await dbConnection();
    const findUser = await User.findOne({ mail: sesion.user.email }).lean();
    if (!findUser)
      throw new Error(t("errors.no.user.id.found.to"));
    const newTransaction = new Transaction({
      user: findUser._id,
      wallet: findUser.wallet,
      name: !transaction.name ? "transaction nameless" : transaction.name,
      amount: transaction.amount,
      isIncome: transaction.isIncome,
      isBill: transaction.isBill,
      isReadable: true,
      date: !transaction.date ? new Date() : transaction.date,
      account: null,
      category: null,
    });
    if (transaction.category) {
      const categoryFound = await Category.findOne({
        name: new RegExp(`^${transaction.category}$`, "i"),
        user: findUser._id,
      });
      if (!categoryFound) {
        newTransaction.category = null as unknown as mongoose.Types.ObjectId;
      } else {
        newTransaction.category = categoryFound._id as mongoose.Types.ObjectId;
      }
    }
    if (transaction.account) {
      const accountFound = await Account.findOne({
        name: new RegExp(`^${transaction.account}$`, "i"),
        user: findUser._id,
      });
      if (!accountFound) {
        newTransaction.account = null as unknown as mongoose.Types.ObjectId;
      } else {
        newTransaction.account = accountFound._id as mongoose.Types.ObjectId;
      }
    }
    const parentWallet = (await (
      Wallet as unknown as {
        findById: (walletId: unknown) => {
          lean: () => Promise<{ primaryCurrency?: string } | null>;
        };
      }
    )
      .findById(findUser.wallet)
      .lean()) as { primaryCurrency?: string } | null;
    if (!parentWallet)
      throw new Error(t("errors.no.wallet.found.to.create"));
    // .lean() never applies schema defaults - a real Wallet/Account document
    // that predates the multi-currency migration has no primaryCurrency/
    // currency field in its stored BSON at all.
    const walletPrimaryCurrency = parentWallet.primaryCurrency || "MXN";
    const accountCurrency = newTransaction.account
      ? (await Account.findById(newTransaction.account).lean())?.currency ||
        walletPrimaryCurrency
      : walletPrimaryCurrency;
    newTransaction.kind = newTransaction.isIncome ? "income" : "expense";
    newTransaction.direction = newTransaction.isIncome ? "credit" : "debit";
    newTransaction.money = await (
      buildTransactionMoney as (params: {
        accountAmount?: number;
        accountCurrency?: string;
        merchantAmount?: number | string | null;
        merchantCurrency?: string | null;
        walletPrimaryCurrency?: string;
        date?: Date | string | null;
        manualReportingAmount?: number | string | null;
      }) => Promise<ITransactionMoney>
    )({
      accountAmount: newTransaction.amount,
      accountCurrency,
      walletPrimaryCurrency,
      date: newTransaction.date,
    });

    const savedTransacction = await newTransaction.save();
    if (!savedTransacction)
      throw new Error(
        t("errors.new.transactions.could.not.be.2")
      );
    const finalTransaction = await Transaction.findById(savedTransacction._id)
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
      .lean();
    if (!finalTransaction)
      throw new Error(t("errors.new.transactions.could.not.be.3"));
    const [transactionWithDisplayMoney] = await attachDisplayMoneyToList(
      [finalTransaction],
      walletPrimaryCurrency
    );
    return NextResponse.json({
      message: t("errors.api.createdByVoice", { p1: savedTransacction.name || t("errors.api.transactionFallback") }),
      data: transactionWithDisplayMoney,
      status: 201,
      ok: true,
    });
  } catch (e) {
    throw new Error(e as string);
  }
}
