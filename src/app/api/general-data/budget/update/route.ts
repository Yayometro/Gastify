import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Budget, { type IBudget, type IBudgetCategoryEntry } from "@/model/Budget";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import type mongoose from "mongoose";
import "@/model/Category";
import "@/model/SubCategory";
import "@/model/Account";
import "@/model/Tag";

export interface UpdateBudgetGetStatusResponse {
  mes: string;
}

export interface UpdateBudgetRequestBody {
  id?: mongoose.Types.ObjectId | string;
  name?: string | null;
  goalAmount?: number | string;
  category?: mongoose.Types.ObjectId | string | null;
  subCategory?: mongoose.Types.ObjectId | string | null;
  isSurpassed?: boolean;
  isSaving?: boolean;
  savingAmount?: number | string;
  categories?: IBudgetCategoryEntry[];
  period?: "monthly" | "quarterly" | "biannual" | "yearly" | string;
  linkedAccounts?: (mongoose.Types.ObjectId | string)[];
  budgetType?: "spending" | "saving" | "project" | string;
  eventStartDate?: string | Date | null;
  eventEndDate?: string | Date | null;
  linkedTags?: (mongoose.Types.ObjectId | string)[];
  icon?: string | null;
  currency?: string;
  [key: string]: unknown;
}

export interface UpdateBudgetSuccessResponse {
  message: string;
  data: IBudget;
  status: number;
  ok: boolean;
}

export type UpdateBudgetResponse = UpdateBudgetSuccessResponse;

export async function GET(): Promise<NextResponse<UpdateBudgetGetStatusResponse>> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<UpdateBudgetResponse>> {
  try {
    if (!request) throw new Error("No data in request on NEW BUDGET POST");
    const {
      id,
      name,
      goalAmount,
      category,
      subCategory,
      isSurpassed,
      isSaving,
      savingAmount,
      categories,
      period,
      linkedAccounts,
      budgetType,
      eventStartDate,
      eventEndDate,
      linkedTags,
      icon,
      currency,
    } = (await request.json()) as UpdateBudgetRequestBody;
    if (!id) throw new Error(`No ID  was provided to update budget 🤕`);
    // Security fix: this used to look up the Budget by id alone, with zero
    // ownership check - this endpoint isn't covered by middleware.ts's
    // matcher, so any caller could edit any other user's budget. Now the
    // lookup is scoped to the caller's own wallet (session-derived), so an
    // id belonging to someone else's budget fails the same "not found"
    // check as a bogus id.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on UPDATE BUDGET");
    // FIND WALLET and UPDATE
    const updateBudget = await Budget.findOne({ _id: id, wallet: userFound.wallet });
    //IF ERROR
    if (!updateBudget) throw new Error(`No Budget was identified to update 🤕`);
    // VERSION HISTORY if goalAmount/savingAmount is actually changing
    const amountIsChanging =
      (goalAmount !== undefined && Number(goalAmount) !== Number(updateBudget.goalAmount)) ||
      (savingAmount !== undefined && Number(savingAmount) !== Number(updateBudget.savingAmount));
    if (amountIsChanging) {
      const now = new Date();
      const openEntry = updateBudget.history?.find((h) => !h.effectiveTo);
      if (openEntry) openEntry.effectiveTo = now;
      updateBudget.history = updateBudget.history || [];
      updateBudget.history.push({
        goalAmount: goalAmount !== undefined ? Number(goalAmount) : updateBudget.goalAmount,
        savingAmount: savingAmount !== undefined ? Number(savingAmount) : updateBudget.savingAmount,
        effectiveFrom: now,
        effectiveTo: null,
      });
    }
    //UPDATE:
    //name
    updateBudget.name = !name ? updateBudget.name : name;
    //goalAmount
    updateBudget.goalAmount =
      goalAmount !== undefined ? Number(goalAmount) : updateBudget.goalAmount;
    //isSurpassed
    updateBudget.isSurpassed = !isSurpassed
      ? updateBudget.isSurpassed
      : isSurpassed;
    //category (undefined = don't touch; null/id = set it, including explicitly clearing it)
    updateBudget.category = category === undefined ? updateBudget.category : category;
    //subCategory (same as category - null explicitly clears it, e.g. switching to a parent-only category)
    updateBudget.subCategory = subCategory === undefined ? updateBudget.subCategory : subCategory;
    //isSaving (boolean, so check for undefined rather than falsy - false is a valid value)
    updateBudget.isSaving = isSaving === undefined ? updateBudget.isSaving : isSaving;
    if (budgetType !== undefined) {
      updateBudget.budgetType = budgetType;
      updateBudget.isSaving = budgetType === "saving";
    }
    //savingAmount
    updateBudget.savingAmount =
      savingAmount !== undefined ? Number(savingAmount) : updateBudget.savingAmount;
    //period
    if (period !== undefined) updateBudget.period = period;
    //categories array
    if (categories !== undefined) updateBudget.categories = categories;
    //linkedAccounts array
    if (linkedAccounts !== undefined) updateBudget.linkedAccounts = linkedAccounts;
    if (linkedTags !== undefined) updateBudget.linkedTags = linkedTags;
    if (icon !== undefined) updateBudget.icon = icon || "md/MdFlightTakeoff";
    if (currency !== undefined) updateBudget.currency = currency;
    if (eventStartDate !== undefined) {
      updateBudget.eventStartDate = eventStartDate ? new Date(eventStartDate) : null;
    }
    if (eventEndDate !== undefined) {
      updateBudget.eventEndDate = eventEndDate ? new Date(eventEndDate) : null;
    }
    // SAVE
    const savedBudget = await updateBudget.save();
    //IF ERROR
    if (!savedBudget) throw new Error("Updated Budget was not saved 🤕");
    await savedBudget.populate([
      { path: "category", strictPopulate: false },
      { path: "subCategory", strictPopulate: false },
      { path: "categories.category", strictPopulate: false },
      { path: "categories.subCategory", strictPopulate: false },
      { path: "linkedAccounts", strictPopulate: false },
      { path: "linkedTags", strictPopulate: false },
    ]);
    return NextResponse.json({
      message: `${savedBudget.name} was updated successfully 🤓`,
      data: savedBudget,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
