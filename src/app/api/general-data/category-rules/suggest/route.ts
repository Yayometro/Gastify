import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Transaction from "@/model/Transaction";
import CategoryRule from "@/model/CategoryRule";
import "@/model/Category";
import "@/model/SubCategory";
import "@/model/Tag";
import "@/model/Account";
import Wallet from "@/model/Wallet";
import {
  suggestCategory,
  type CategoryRuleLike,
  type NativeMoneyInput,
} from "@/helpers/transformers/categoryRuleMatcher";
import {
  attachDisplayMoneyToList,
  type WithDisplayMoney,
} from "@/lib/money/server/transactionReadService";
import { auth } from "@/lib/auth/betterAuth";

export interface SuggestRequestBody {
  mail?: string | null;
  transactionIds?: string[] | null;
}

export interface SuggestionCategoryData {
  _id?: unknown;
  name?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface SuggestionPayload {
  category: SuggestionCategoryData | null;
  subCategory: SuggestionCategoryData | null;
  confidence?: string | null;
}

export interface SuggestionEntry {
  transaction: unknown;
  suggestion: SuggestionPayload;
}

export interface SuggestSuccessResponse {
  message: string;
  data: SuggestionEntry[];
  status: number;
  ok: true;
}

export type SuggestResponse = SuggestSuccessResponse;

interface WalletModelBridge {
  findById: (id: unknown) => {
    lean: () => Promise<{
      primaryCurrency?: string;
      [key: string]: unknown;
    } | null>;
  };
}

interface CategoryRuleModelBridge {
  find: (filter: unknown) => {
    populate: (path: string) => {
      populate: (path: string) => {
        lean: () => Promise<CategoryRuleLike[]>;
      };
    };
  };
}

export async function POST(
  request: NextRequest | Request,
): Promise<NextResponse<SuggestResponse>> {
  try {
    if (!request)
      throw new Error("No data in request on CATEGORY RULES SUGGEST POST");
    const { transactionIds } = (await request.json()) as SuggestRequestBody;

    // Security fix: previously this route relied on client-supplied `mail` without
    // session verification, allowing any caller to query any user's uncategorized
    // transactions and category rules. We now authenticate via auth.api.getSession,
    // ignore client-sent `mail`, and scope all lookups to the session user and wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found, review the email provided");
    const walletId = userFound.wallet;

    const transactionQuery =
      Array.isArray(transactionIds) && transactionIds.length > 0
        ? { _id: { $in: transactionIds }, wallet: walletId }
        : { wallet: walletId, category: null, subCategory: null };

    const [transactions, rules, parentWallet] = await Promise.all([
      Transaction.find(transactionQuery)
        .populate("account")
        .populate("tags")
        .lean(),
      (CategoryRule as unknown as CategoryRuleModelBridge)
        .find({ wallet: walletId })
        .populate("category")
        .populate("subCategory")
        .lean(),
      (Wallet as unknown as WalletModelBridge).findById(walletId).lean(),
    ]);

    const uncategorizedRaw = transactions.filter(
      (t) => !t.category && !t.subCategory,
    );
    const uncategorized = await attachDisplayMoneyToList(
      uncategorizedRaw,
      parentWallet?.primaryCurrency || "MXN",
    );

    const suggestions = uncategorized
      .map((t: WithDisplayMoney<Record<string, unknown>>) => {
        const match = suggestCategory(
          t.name as string | undefined,
          t.displayMoney?.native as unknown as NativeMoneyInput,
          rules,
        );
        if (!match) return null;
        return {
          transaction: t,
          suggestion: {
            category: match.category
              ? {
                  _id: match.category._id,
                  name: match.category.name,
                  icon: match.category.icon,
                  color: match.category.color,
                }
              : null,
            subCategory: match.subCategory
              ? {
                  _id: match.subCategory._id,
                  name: match.subCategory.name,
                  icon: match.subCategory.icon,
                  color: match.subCategory.color,
                }
              : null,
            confidence: match.confidence,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return NextResponse.json({
      message: `${suggestions.length} suggestion(s) found`,
      data: suggestions,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
