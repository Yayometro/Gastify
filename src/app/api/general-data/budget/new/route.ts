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

export interface NewBudgetGetStatusResponse {
  mes: string;
}

export interface NewBudgetRequestBody {
  name?: string | null;
  goalAmount?: number;
  category?: mongoose.Types.ObjectId | string | null;
  subCategory?: mongoose.Types.ObjectId | string | null;
  savingAmount?: number;
  isSaving?: boolean;
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

export interface NewBudgetSuccessResponse {
  message: string;
  data: IBudget;
  status: number;
  ok: boolean;
}

export type NewBudgetResponse = NewBudgetSuccessResponse;

export async function GET(): Promise<NextResponse<NewBudgetGetStatusResponse>> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<NewBudgetResponse>> {
  try {
    if (!request) throw new Error("No data in request on NEW BUDGET POST");
    const {
      name,
      goalAmount,
      category,
      subCategory,
      savingAmount,
      isSaving,
      categories,
      period,
      linkedAccounts,
      budgetType,
      eventStartDate,
      eventEndDate,
      linkedTags,
      icon,
      currency,
    } = (await request.json()) as NewBudgetRequestBody;
    // Security fix: this used to trust whatever user/wallet the client sent
    // in the body, letting any caller (this endpoint isn't covered by
    // middleware.ts's matcher) plant a budget inside ANY OTHER user's
    // wallet. Now they're always derived from the caller's own session
    // instead. The only real call site (BudgetEditModal.jsx) already sends
    // the caller's own ids anyway.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error("User not found on NEW BUDGET");
    const user = userFound._id;
    const wallet = userFound.wallet;
    // FIND WALLET
    const resolvedBudgetType = budgetType || (isSaving ? "saving" : "spending");
    const newBudget = new Budget({
      name: name || null,
      goalAmount: goalAmount || 1,
      isSurpassed: false,
      user: user,
      wallet: wallet,
      isSaving: resolvedBudgetType === "saving",
      budgetType: resolvedBudgetType,
      icon: resolvedBudgetType === "project" ? icon || "md/MdFlightTakeoff" : null,
      savingAmount: savingAmount || 0,
      currency: currency || "MXN",
      period: period || "monthly",
      linkedAccounts: linkedAccounts || [],
      linkedTags: linkedTags || [],
      eventStartDate: eventStartDate ? new Date(eventStartDate) : null,
      eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
      history: [{
        goalAmount: goalAmount || 1,
        savingAmount: savingAmount || 0,
        effectiveFrom: new Date(),
        effectiveTo: null,
      }],
    });
    newBudget.category = category || null;
    newBudget.subCategory = subCategory || null;
    if (categories && Array.isArray(categories) && categories.length > 0) {
      newBudget.categories = categories;
    }
    //IF ERROR
    if (!newBudget) throw new Error(`No Budget was identified 🤕`);
    // SAVE
    const savedBudget = await newBudget.save();
    //IF ERROR
    if (!savedBudget) throw new Error("New Budget was not saved 🤕");
    await savedBudget.populate([
      { path: "category", strictPopulate: false },
      { path: "subCategory", strictPopulate: false },
      { path: "categories.category", strictPopulate: false },
      { path: "categories.subCategory", strictPopulate: false },
      { path: "linkedAccounts", strictPopulate: false },
      { path: "linkedTags", strictPopulate: false },
    ]);
    return NextResponse.json({
      message: `${savedBudget.name} was created successfully 🤓`,
      data: savedBudget,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
