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
import { auth } from "@/lib/auth/betterAuth";

export const speechAddSchema = z
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
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    const transObj = ((await request.json()) || {}) as SpeechAddRequestBody;
    console.log(transObj);

    // Security fix: this route previously lacked session verification and trusted
    // whatever user id was passed in the request body (IDOR), creating transactions
    // in another user's wallet. We now verify the session via auth.api.getSession,
    // find the authenticated user by email, and derive user and wallet directly from the session.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

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
    console.log(titleMatch);
    console.log(amountMatch);
    console.log(dateMatch);
    console.log(timeMatch);
    console.log(categoryMatch);
    console.log(accountMatch);
    //Validating escential data
    if (!titleMatch) {
      console.log(titleMatch);
      throw new Error("Title of transaction data is missing and is required");
    }
    if (!amountMatch) {
      console.log(amountMatch);
      throw new Error("Amount of transaction data is missing and is required");
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
      console.log(typesMatch);
      if (typesMatch) {
        transaction.isBill = /expense|bill/.test(typesMatch[4]);
        console.log(transaction.isBill); // Ahora debería reflejar correctamente si es un bill
        transaction.isIncome = /income/.test(typesMatch[4]);
        console.log(transaction.isIncome); // Y esto si es un ingreso
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

    console.log(transaction);

    await dbConnection();
    const findUser = await User.findOne({ mail: sesion.user.email }).lean();
    if (!findUser)
      throw new Error("No User ID finded to create a new Transaction");
    console.log(findUser);
    const newTransacction = new Transaction({
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
    console.log(newTransacction);
    if (transaction.category) {
      const categoryFound = await Category.findOne({
        name: new RegExp(`^${transaction.category}$`, "i"),
        user: findUser._id,
      });
      console.log(categoryFound);
      if (!categoryFound) {
        console.log(categoryFound);
        newTransacction.category = null as unknown as mongoose.Types.ObjectId;
      } else {
        newTransacction.category = categoryFound._id as mongoose.Types.ObjectId;
      }
    }
    if (transaction.account) {
      console.log(transaction.account);
      const accountFound = await Account.findOne({
        name: new RegExp(`^${transaction.account}$`, "i"),
        user: findUser._id,
      });
      console.log(accountFound);
      if (!accountFound) {
        console.log(accountFound);
        newTransacction.account = null as unknown as mongoose.Types.ObjectId;
      } else {
        newTransacction.account = accountFound._id as mongoose.Types.ObjectId;
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
      throw new Error("No Wallet found to create a new Transaction");
    // .lean() never applies schema defaults - a real Wallet/Account document
    // that predates the multi-currency migration has no primaryCurrency/
    // currency field in its stored BSON at all.
    const walletPrimaryCurrency = parentWallet.primaryCurrency || "MXN";
    const accountCurrency = newTransacction.account
      ? (await Account.findById(newTransacction.account).lean())?.currency ||
        walletPrimaryCurrency
      : walletPrimaryCurrency;
    newTransacction.kind = newTransacction.isIncome ? "income" : "expense";
    newTransacction.direction = newTransacction.isIncome ? "credit" : "debit";
    newTransacction.money = await (
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
      accountAmount: newTransacction.amount,
      accountCurrency,
      walletPrimaryCurrency,
      date: newTransacction.date,
    });

    const savedTransacction = await newTransacction.save();
    if (!savedTransacction)
      throw new Error(
        "NEW TRANSACTIONS could not be saved on Speach New Transaction Post"
      );
    console.log(savedTransacction);
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
      throw new Error("NEW TRANSACTIONS could not be loaded on POST");
    const [transactionWithDisplayMoney] = await attachDisplayMoneyToList(
      [finalTransaction],
      walletPrimaryCurrency
    );
    return NextResponse.json({
      message: `${
        savedTransacction.name || "Transaction"
      } using voice was created successfully 😎`,
      data: transactionWithDisplayMoney,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as string);
  }
}
