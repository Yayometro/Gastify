import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import User from "@/model/User";
import Account from "@/model/Account";
import "@/model/Tag";
import "@/model/Budget";
import { auth } from "@/lib/auth/betterAuth";
import { toPublicUser } from "@/lib/auth/publicUser";

export interface TransactionsGetAllData {
  user: unknown;
  transaction: unknown;
  categories: unknown;
  defCat: unknown;
  subCategories: unknown;
  accounts: unknown;
}

export interface TransactionsGetAllSuccessResponse {
  data: TransactionsGetAllData;
  message: string;
  status: number;
  ok: boolean;
}

export type TransactionsGetAllResponse = TransactionsGetAllSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<TransactionsGetAllResponse>> {
  try {
    if (!request)
      throw new Error("No request received from get-all in Transactions");

    // Security fix: this route previously lacked session verification and trusted
    // whatever userMail was sent in the request body (IDOR), returning another user's
    // entire transactions, categories, subcategories, accounts, and user profile data.
    // We now verify auth.api.getSession, resolve the session user, and scope all
    // database lookups to that authenticated user and wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found, review the email provided in GENERAL-DATA POST");
    const userId = userFound._id;
    const walletId = userFound.wallet;

    //FIND TRANSACTIONS
    const movementsFounded = await Transaction.find({
      user: userId,
      wallet: walletId,
    })
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
    if (!movementsFounded)
      throw new Error(
        "No movements found, review the user and wallet id on get-all/transactions in POST"
      );

    //FIND CATEGORIES
    const categoriesFounded = await Category.find({
      user: userId,
      wallet: walletId,
    }).lean();
    if (!categoriesFounded)
      throw new Error(
        "No categories found, review the user and wallet id on GENERAL-DATA POST"
      );

    //FIND DEFUALT CATEGORIES
    const defaultCategoriesFounded = await Category.find({
      isDefaultCatego: true,
    }).lean();
    if (!defaultCategoriesFounded)
      throw new Error(
        "No default categories found, review the user and wallet id on GENERAL-DATA POST"
      );

    //FIND SUB CATEGORIES
    const subCategoriesFounded = await SubCategory.find({
      user: userId,
      wallet: walletId,
    })
      .lean()
      .populate({
        path: "fatherCategory",
      });
    if (!subCategoriesFounded)
      throw new Error(
        "No SubCategories found, review the user and wallet id on GENERAL-DATA POST"
      );

    // ACCOUNTS
    const accountsFounded = await Account.find({
      user: userId,
      wallet: walletId,
    });
    if (!accountsFounded)
      throw new Error(
        "No Accounts found, review the user and wallet id on GENERAL-DATA POST"
      );

    const dataFull = {
      user: toPublicUser(userFound),
      transaction: movementsFounded,
      categories: categoriesFounded,
      defCat: defaultCategoriesFounded,
      subCategories: subCategoriesFounded,
      accounts: accountsFounded,
    };
    return NextResponse.json({
      data: dataFull,
      message: "Categories and SubCategories founded",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
