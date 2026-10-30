import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Budget, { type IBudget } from "@/model/Budget";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import type mongoose from "mongoose";
import { serverT } from "@/i18n/server";
import { releaseSavingBudgetClaims } from "@/lib/goals/fundingClaims";

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
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.9"));
    const { id } = (await request.json()) as RemoveBudgetRequestBody;
    if (!id)
      throw new Error(t("errors.api.noIdRemoveBudget"));
    // Security fix: this used to look up the Budget by id alone, with zero
    // ownership check - this endpoint isn't covered by middleware.ts's
    // matcher, so any caller could archive (and unlink the transactions of)
    // any other user's budget. Now the lookup is scoped to the caller's own
    // wallet (session-derived).
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.remove.5"));
    // SOFT DELETE: keep the document so past months in Projections can still read its history
    const removedBudget = await Budget.findOne({ _id: id, wallet: userFound.wallet });
    //IF ERROR
    if (!removedBudget) throw new Error(t("errors.budget.was.not.removed.verify"));
    removedBudget.archived = true;
    const openEntry = removedBudget.history?.find((h) => !h.effectiveTo);
    if (openEntry) openEntry.effectiveTo = new Date();
    await removedBudget.save();
    if ((removedBudget.budgetType || (removedBudget.isSaving ? "saving" : "spending")) === "saving") await releaseSavingBudgetClaims(userFound.wallet, removedBudget._id);
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
      message: t("errors.api.budgetRemoved", { p1: removedBudget?.name }),
      data: removedBudget,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
