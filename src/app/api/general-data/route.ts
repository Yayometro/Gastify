import dbConnection from "@/app/api/dbConnection";
import { NextResponse, type NextRequest } from "next/server";

import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import Budget from "@/model/Budget";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import Tag from "@/model/Tag";
import SubCategory from "@/model/SubCategory";
import { auth } from "@/lib/auth/betterAuth";

export interface GeneralDataStaticGetResponse {
  message: string;
  status: number;
  ok: true;
}

export interface GeneralDataFullInfo {
  user: unknown;
  wallet: unknown;
  accounts: unknown[];
  budgets: unknown[];
  transactions: unknown[];
  categories: unknown[];
  subCategories: unknown[];
  tags: unknown[];
}

export interface GeneralDataPostResponse {
  data: GeneralDataFullInfo;
  message: string;
  status: number;
  ok: true;
}

interface WalletModelBridge {
  findById: (id: unknown) => {
    lean: () => Promise<Record<string, unknown> | null>;
  };
}

export async function GET(): Promise<NextResponse<GeneralDataStaticGetResponse>> {
  try {
    return NextResponse.json({
      message: "Data founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<GeneralDataPostResponse>> {
  try {
    if (!request) throw new Error("No data in request on GENERAL-DATA POST");
    const dataRequest = (await request.json()) as unknown;
    console.log(dataRequest);

    // Security fix: previously this route lacked session authentication and dumped
    // full user data by reading the email directly from the raw request body (`dataRequest`).
    // We now authenticate the caller session using auth.api.getSession, ignore the client's
    // raw email body, and fetch data strictly for the authenticated session user.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    // CONNECTION
    await dbConnection();

    // FIND USER
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(
        { error: "User not found, review the email provided in GENERAL-DATA POST" } as unknown as string
      );
    const userId = userFound._id;
    const walletId = userFound.wallet;

    // FIND WALLET
    const walletFound = await (Wallet as unknown as WalletModelBridge)
      .findById(walletId)
      .lean();
    // IF ERROR
    if (!walletFound)
      throw new Error("Wallet no found, review the wallet id on GENERAL-DATA POST");

    // FIND ACCOUNTS
    const accountsFounded = await Account.find({ user: userId, wallet: walletId }).lean();
    if (!accountsFounded)
      throw new Error("Accounts no found, review the user id on GENERAL-DATA POST");

    // FIND BUDGETS
    const budgetsFounded = await Budget.find({ user: userId, wallet: walletId }).populate([
      { path: "category", strictPopulate: false },
      { path: "subCategory", strictPopulate: false },
      { path: "categories.category", strictPopulate: false },
      { path: "categories.subCategory", strictPopulate: false },
      { path: "linkedAccounts", strictPopulate: false },
      { path: "linkedTags", strictPopulate: false },
    ]);
    if (!budgetsFounded)
      throw new Error("No Budgets found, review the user and wallet id on GENERAL-DATA POST");

    // FIND TRANSACTIONS
    const transactionsFounded = await Transaction.find({ user: userId, wallet: walletId })
      .lean()
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
      });

    if (!transactionsFounded)
      throw new Error(
        "No transactions found, review the user and wallet id on GENERAL-DATA POST"
      );

    // FIND CATEGORIES
    const categoriesFounded = await Category.find({ user: userId, wallet: walletId }).lean();
    if (!categoriesFounded)
      throw new Error("No categories found, review the user and wallet id on GENERAL-DATA POST");

    // FIND DEFUALT CATEGORIES
    const defaultCategoriesFounded = await Category.find({ isDefaultCatego: true }).lean();
    if (!defaultCategoriesFounded)
      throw new Error(
        "No default categories found, review the user and wallet id on GENERAL-DATA POST"
      );

    // MIXING CATEGORIES
    const mixedCategories = categoriesFounded.concat(defaultCategoriesFounded);
    if (!mixedCategories)
      throw new Error("Mixing categories was wrong, review data in GENERAL-DATA POST");

    // FIND CATEGORIES
    const subCategoriesFounded = await SubCategory.find({ user: userId, wallet: walletId })
      .lean()
      .populate({
        path: "fatherCategory",
      });
    if (!subCategoriesFounded)
      throw new Error(
        "No SubCategories found, review the user and wallet id on GENERAL-DATA POST"
      );

    // FIND TAGS
    const tagsFounded = await Tag.find({ user: userId, wallet: walletId }).lean();
    if (!tagsFounded)
      throw new Error("No Tags found, review the user and wallet id on GENERAL-DATA POST");

    const fullInfo: GeneralDataFullInfo = {
      user: userFound,
      wallet: walletFound,
      accounts: accountsFounded,
      budgets: budgetsFounded,
      transactions: transactionsFounded,
      categories: mixedCategories,
      subCategories: subCategoriesFounded,
      tags: tagsFounded,
    };

    return NextResponse.json({
      data: fullInfo,
      message: "Data founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
