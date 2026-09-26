import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type mongoose from "mongoose";
import dbConnection from "@/app/api/dbConnection";
import Transaction from "@/model/Transaction";
import Budget from "@/model/Budget";
import User from "@/model/User";
import "@/model/Tag";
import "@/model/Account";
import "@/model/Category";
import "@/model/SubCategory";
import { auth } from "@/lib/auth/betterAuth";

export const linkBudgetSchema = z
  .object({
    transactionId: z.string({
      required_error: "Transaction id is required",
    }),
    budgetId: z.string().optional().nullable(),
  })
  .passthrough();

export type LinkBudgetRequestBody = z.infer<typeof linkBudgetSchema>;

export interface LinkBudgetSuccessResponse {
  ok: true;
  status: number;
  message: string;
  data: unknown;
}

export type LinkBudgetResponse = LinkBudgetSuccessResponse;

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<LinkBudgetResponse>> {
  try {
    const { transactionId, budgetId } =
      ((await request.json()) || {}) as LinkBudgetRequestBody;
    if (!transactionId) throw new Error("Transaction id is required");

    // Security fix: this route previously lacked session verification and
    // performed Transaction.findById(transactionId) directly with zero ownership check (IDOR).
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and scope transaction and budget queries
    // to the user's wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error("User not found on LINK BUDGET");

    const transaction = await Transaction.findOne({
      _id: transactionId,
      wallet: userFound.wallet,
    });
    if (!transaction) throw new Error("Transaction was not found");

    if (budgetId) {
      const budget = await Budget.findOne({
        _id: budgetId,
        user: transaction.user,
        wallet: transaction.wallet,
        archived: { $ne: true },
      });
      if (
        !budget ||
        (budget.budgetType || (budget.isSaving ? "saving" : "spending")) !== "project"
      ) {
        throw new Error("Project budget was not found");
      }
      transaction.budget = budget._id as mongoose.Types.ObjectId;
    } else {
      transaction.budget = null as unknown as mongoose.Types.ObjectId;
    }

    await transaction.save();
    const populated = await Transaction.findById(transaction._id)
      .populate("tags")
      .populate("account")
      .populate("category")
      .populate("subCategory")
      .populate("budget");

    return NextResponse.json({
      ok: true,
      status: 201,
      message: budgetId
        ? "Movement added to project"
        : "Movement removed from project",
      data: populated,
    });
  } catch (error) {
    console.log(error);
    throw new Error(error as string);
  }
}
