import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Transaction from "@/model/Transaction";
import CategoryRule from "@/model/CategoryRule";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Tag from "@/model/Tag";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import { suggestCategory } from "@/helpers/transformers/categoryRuleMatcher";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";

export async function POST(request) {
  try {
    if (!request) throw new Error("No data in request on CATEGORY RULES SUGGEST POST");
    const { mail, transactionIds } = await request.json();
    if (!mail) throw new Error("No mail was provided to suggest categories 🤕");
    await dbConnection();

    const userFound = await User.findOne({ mail }).lean();
    if (!userFound) throw new Error("User not found, review the email provided");
    const walletId = userFound.wallet;

    const transactionQuery = Array.isArray(transactionIds) && transactionIds.length > 0
      ? { _id: { $in: transactionIds }, wallet: walletId }
      : { wallet: walletId, category: null, subCategory: null };

    const [transactions, rules, parentWallet] = await Promise.all([
      Transaction.find(transactionQuery)
        .populate("account")
        .populate("tags")
        .lean(),
      CategoryRule.find({ wallet: walletId }).populate("category").populate("subCategory").lean(),
      Wallet.findById(walletId).lean(),
    ]);

    const uncategorizedRaw = transactions.filter((t) => !t.category && !t.subCategory);
    const uncategorized = await attachDisplayMoneyToList(uncategorizedRaw, parentWallet?.primaryCurrency || "MXN");

    const suggestions = uncategorized
      .map((t) => {
        const match = suggestCategory(t.name, t.amount, rules);
        if (!match) return null;
        return {
          transaction: t,
          suggestion: {
            category: match.category
              ? { _id: match.category._id, name: match.category.name, icon: match.category.icon, color: match.category.color }
              : null,
            subCategory: match.subCategory
              ? { _id: match.subCategory._id, name: match.subCategory.name, icon: match.subCategory.icon, color: match.subCategory.color }
              : null,
            confidence: match.confidence,
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      message: `${suggestions.length} suggestion(s) found`,
      data: suggestions,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
