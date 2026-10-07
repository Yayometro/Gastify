import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Transaction, { type ITransaction } from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import "@/model/Tag";
import "@/model/Account";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

export interface CategorySuggestionApplication {
  transactionId?: string | null;
  category?: string | null;
  subCategory?: string | null;
}

export interface ApplySuggestionsRequestBody {
  applications?: CategorySuggestionApplication[] | null;
}

export interface ApplySuggestionsSuccessResponse {
  message: string;
  data: unknown[];
  status: number;
  ok: true;
}

export type ApplySuggestionsResponse = ApplySuggestionsSuccessResponse;

function assertOwnedOrDefault<T extends { user?: unknown; wallet?: unknown }>(
  doc: T | null | undefined,
  user: unknown,
  wallet: unknown,
  message: string,
  defaultFlag?: string
): T {
  if (!doc) throw new Error(message);
  if (defaultFlag && (doc as Record<string, unknown>)[defaultFlag]) return doc;
  if (String(doc.user) !== String(user) || String(doc.wallet) !== String(wallet)) {
    throw new Error(message);
  }
  return doc;
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<ApplySuggestionsResponse>> {
  try {
    if (!request) throw new Error("No data in request on APPLY SUGGESTIONS POST");
    // applications: [{ transactionId, category, subCategory }] - each row can carry
    // a different category, unlike edit-many which applies one value to a whole batch.
    const { applications } = (await request.json()) as ApplySuggestionsRequestBody;
    if (!Array.isArray(applications) || applications.length === 0)
      throw new Error("No applications were provided to apply-suggestions 🤕");

    // Security fix: previously this route lacked session authentication and updated
    // transactions and assigned category/subCategory without verifying ownership.
    // We now authenticate the caller session, scope transaction lookups to the caller's
    // user and wallet, and verify category/subCategory ownership or default status.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on APPLY SUGGESTIONS POST");

    // Two passes (bug 125): everything is validated FIRST (ownership, a category that matches its
    // sub-category, valid ids) and nothing is saved until the whole batch is valid. It used to save as
    // it went, so a bad id in the middle left the earlier movements already changed.
    type PreparedApplication = {
      transaction: ITransaction;
      subCategory?: string;
      category?: string;
    };
    const prepared: PreparedApplication[] = [];
    for (const app of applications) {
      if (!app.transactionId) continue;
      const transaction = await Transaction.findOne({
        _id: app.transactionId,
        user: userFound._id,
        wallet: userFound.wallet,
      });
      if (!transaction) continue;
      let foundSub: { fatherCategory?: unknown } | null = null;
      if (app.subCategory) {
        foundSub = await SubCategory.findById(app.subCategory).lean();
        assertOwnedOrDefault(
          foundSub as { user?: unknown; wallet?: unknown } | null,
          userFound._id,
          userFound.wallet,
          "No SUB-CATEGORY found at APPLY SUGGESTIONS",
          "isDefaultSubCatego"
        );
      }
      if (app.category) {
        const foundCat = await Category.findById(app.category).lean();
        assertOwnedOrDefault(
          foundCat,
          userFound._id,
          userFound.wallet,
          "Category not found for this user",
          "isDefaultCatego"
        );
      }
      // A sub-category must belong to the category it is applied with.
      if (foundSub && app.category && String(foundSub.fatherCategory) !== String(app.category)) {
        throw new Error("The sub-category does not belong to that category 🤕");
      }
      prepared.push({ transaction, subCategory: app.subCategory, category: app.category });
    }

    const updated: unknown[] = [];
    for (const { transaction, subCategory, category } of prepared) {
      if (subCategory) transaction.subCategory = subCategory as unknown as typeof transaction.subCategory;
      if (category) transaction.category = category as unknown as typeof transaction.category;
      await transaction.save();
      updated.push(transaction._id);
    }

    const populated = await Transaction.find({
      _id: { $in: updated },
      user: userFound._id,
      wallet: userFound.wallet,
    })
      .populate("category")
      .populate("subCategory")
      .populate("tags")
      .populate("account")
      .lean();

    return NextResponse.json({
      message: `${populated.length} transaction(s) categorized`,
      data: populated,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
