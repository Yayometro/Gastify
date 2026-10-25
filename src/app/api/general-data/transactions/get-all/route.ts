import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import User from "@/model/User";
import Account from "@/model/Account";
import "@/model/Tag";
import "@/model/Budget";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { toPublicUser } from "@/lib/auth/publicUser";
import { serverT } from "@/i18n/server";

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
  const t = await serverT(["errors"]);
  try {
    if (!request)
      throw new Error(t("errors.no.request.received.from.get"));

    // Security fix: this route previously lacked session verification and trusted
    // whatever userMail was sent in the request body (IDOR), returning another user's
    // entire transactions, categories, subcategories, accounts, and user profile data.
    // We now verify auth.api.getSession, resolve the session user, and scope all
    // database lookups to that authenticated user and wallet.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));

    //DB
    await dbConnection();
    // User find
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(t("errors.user.not.found.review.the"));
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
        t("errors.no.movements.found.review.the")
      );

    //FIND CATEGORIES
    const categoriesFounded = await Category.find({
      user: userId,
      wallet: walletId,
    }).lean();
    if (!categoriesFounded)
      throw new Error(
        t("errors.no.categories.found.review.the")
      );

    //FIND DEFUALT CATEGORIES
    const defaultCategoriesFounded = await Category.find({
      isDefaultCatego: true,
    }).lean();
    if (!defaultCategoriesFounded)
      throw new Error(
        t("errors.no.default.categories.found.review")
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
        t("errors.no.subcategories.found.review.the")
      );

    // ACCOUNTS
    const accountsFounded = await Account.find({
      user: userId,
      wallet: walletId,
    });
    if (!accountsFounded)
      throw new Error(
        t("errors.no.accounts.found.review.the")
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
      message: t("errors.categories.and.subcategories.founded"),
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
