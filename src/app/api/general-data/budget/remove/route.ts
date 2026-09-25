import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Budget, { type IBudget } from "@/model/Budget";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import type mongoose from "mongoose";

export interface RemoveBudgetGetStatusResponse {
  mes: string;
}

export interface RemoveBudgetRequestBody {
  id?: mongoose.Types.ObjectId | string;
  [key: string]: unknown;
}

export interface RemoveBudgetSuccessResponse {
  message: string;
  data: IBudget;
  status: number;
  ok: boolean;
}

export type RemoveBudgetResponse = RemoveBudgetSuccessResponse;

export async function GET(): Promise<NextResponse<RemoveBudgetGetStatusResponse>> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<RemoveBudgetResponse>> {
  try {
    if (!request) throw new Error("No data in request on NEW BUDGET POST");
    const { id } = (await request.json()) as RemoveBudgetRequestBody;
    if (!id)
      throw new Error(
        `No ID was provided to removed the budget 🤕`
      );
    // Security fix: this used to look up the Budget by id alone, with zero
    // ownership check - this endpoint isn't covered by middleware.ts's
    // matcher, so any caller could archive (and unlink the transactions of)
    // any other user's budget. Now the lookup is scoped to the caller's own
    // wallet (session-derived).
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on REMOVE BUDGET");
    // SOFT DELETE: keep the document so past months in Projections can still read its history
    const removedBudget = await Budget.findOne({ _id: id, wallet: userFound.wallet });
    //IF ERROR
    if (!removedBudget) throw new Error("Budget was not removed, verify data ❌");
    removedBudget.archived = true;
    const openEntry = removedBudget.history?.find((h) => !h.effectiveTo);
    if (openEntry) openEntry.effectiveTo = new Date();
    await removedBudget.save();
    if ((removedBudget.budgetType || (removedBudget.isSaving ? "saving" : "spending")) === "project") {
      // Removing a project never removes its movements; they simply become
      // available for another project (and visible as unbudgeted again).
      await (
        Transaction as unknown as {
          updateMany: (filter: unknown, update: unknown) => Promise<unknown>;
        }
      ).updateMany({ budget: removedBudget._id }, { $unset: { budget: 1 } });
    }
    console.log(removedBudget);
    return NextResponse.json({
      message: `Budget ${removedBudget?.name} was removed 🤓`,
      data: removedBudget,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
