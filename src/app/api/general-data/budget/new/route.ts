import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import Budget, { type IBudget, type IBudgetCategoryEntry } from "@/model/Budget";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import type mongoose from "mongoose";
import "@/model/Category";
import "@/model/SubCategory";
import "@/model/Account";
import "@/model/Tag";
import { serverT } from "@/i18n/server";
import { isSupportedCurrency, majorToMinor } from "@gastify/core/money/currencies";
import { parseGoalDetails, validateGoalDetailsDates, validateGoalFinancialDetails, validateGoalMoneyPair, validateGoalSavingMoneyPair } from "@/lib/goals/goalValidation";
import { validateGoalReferences, InvalidGoalReferenceError } from "@/lib/goals/goalReferences";
import { claimSavingAccounts, GoalFundingConflictError, releaseSavingBudgetClaims } from "@/lib/goals/fundingClaims";
import type { GoalDetails } from "@gastify/core/goals/types";

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
  color?: string;
  goalDetails?: unknown;
  goalMoney?: { amountMinor: number; currency: string };
  savingMoney?: { amountMinor: number; currency: string };
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
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.9"));
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
      color,
      goalDetails,
      goalMoney,
      savingMoney,
    } = (await request.json()) as NewBudgetRequestBody;
    // Security fix: this used to trust whatever user/wallet the client sent
    // in the body, letting any caller (this endpoint isn't covered by
    // middleware.ts's matcher) plant a budget inside ANY OTHER user's
    // wallet. Now they're always derived from the caller's own session
    // instead. The only real call site (BudgetEditModal.jsx) already sends
    // the caller's own ids anyway.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.new.4"));
    const user = userFound._id;
    const wallet = userFound.wallet;
    // FIND WALLET
    const resolvedBudgetType = budgetType || (isSaving ? "saving" : "spending");
    if (!["spending", "saving", "project"].includes(resolvedBudgetType)) {
      return NextResponse.json({ message: "El tipo de presupuesto no es válido.", status: 400, ok: false } as never, { status: 400 });
    }
    const resolvedCurrency = currency || "MXN";
    if (!isSupportedCurrency(resolvedCurrency)) {
      return NextResponse.json({ message: "La moneda seleccionada no está disponible.", status: 400, ok: false } as never, { status: 400 });
    }
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ message: "El color del objetivo no es válido.", status: 400, ok: false } as never, { status: 400 });
    }
    if ((linkedAccounts !== undefined && (!Array.isArray(linkedAccounts) || linkedAccounts.length > 100)) ||
        (linkedTags !== undefined && (!Array.isArray(linkedTags) || linkedTags.length > 100))) {
      return NextResponse.json({ message: "La lista de vínculos no es válida.", status: 400, ok: false } as never, { status: 400 });
    }
    if (resolvedBudgetType === "saving" && (linkedAccounts || []).length > 0 && Number(savingAmount || 0) > 0) {
      return NextResponse.json({ message: "Elige saldo manual o cuentas vinculadas, no ambos.", status: 400, ok: false } as never, { status: 400 });
    }
    let parsedGoalDetails: GoalDetails | undefined;
    if (goalDetails !== undefined && goalDetails !== null) {
      const parsed = parseGoalDetails(goalDetails);
      if (!parsed.success || !validateGoalDetailsDates(parsed.data) || resolvedBudgetType !== "saving") {
        return NextResponse.json({ message: "Los datos del objetivo no son válidos o solo se pueden asociar a un ahorro.", status: 400, ok: false } as never, { status: 400 });
      }
      if (!validateGoalMoneyPair(Number(goalAmount), resolvedCurrency, goalMoney) ||
          !validateGoalSavingMoneyPair(Number(savingAmount || 0), resolvedCurrency, savingMoney)) {
        return NextResponse.json({ message: "La meta debe ser mayor que cero y conservar su moneda.", status: 400, ok: false } as never, { status: 400 });
      }
      if (!validateGoalFinancialDetails(Number(goalAmount), resolvedCurrency, parsed.data)) {
        return NextResponse.json({ message: "Revisa la meta, el precio, el enganche y las aportaciones antes de guardar.", status: 400, ok: false } as never, { status: 400 });
      }
      if ((linkedAccounts || []).length > 0 && Number(savingAmount || 0) > 0) {
        return NextResponse.json({ message: "Elige saldo manual o cuentas vinculadas, no ambos.", status: 400, ok: false } as never, { status: 400 });
      }
      await validateGoalReferences({ walletId: wallet, details: parsed.data, linkedAccountIds: (linkedAccounts || []).map(String) });
      parsedGoalDetails = parsed.data;
    } else if (goalDetails === null) {
      return NextResponse.json({ message: "No se puede crear un objetivo vacío.", status: 400, ok: false } as never, { status: 400 });
    }
    const normalizedGoalMoney = parsedGoalDetails ? goalMoney || { amountMinor: majorToMinor(goalAmount || 1, resolvedCurrency), currency: resolvedCurrency } : undefined;
    const normalizedSavingMoney = parsedGoalDetails ? savingMoney || { amountMinor: majorToMinor(savingAmount || 0, resolvedCurrency), currency: resolvedCurrency } : undefined;
    const newBudget = new Budget({
      name: name || null,
      goalAmount: goalAmount || 1,
      isSurpassed: false,
      user: user,
      wallet: wallet,
      isSaving: resolvedBudgetType === "saving",
      budgetType: resolvedBudgetType,
      icon: resolvedBudgetType === "project" ? icon || "fluent/airplane" : null,
      savingAmount: savingAmount || 0,
      currency: currency || "MXN",
      color: color || undefined,
      goalDetails: parsedGoalDetails,
      revision: parsedGoalDetails ? 0 : undefined,
      ...(parsedGoalDetails ? { goalMoney: normalizedGoalMoney, savingMoney: normalizedSavingMoney } : {}),
      period: period || "monthly",
      linkedAccounts: linkedAccounts || [],
      linkedTags: linkedTags || [],
      eventStartDate: eventStartDate ? new Date(eventStartDate) : null,
      eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
      history: [{
        goalAmount: goalAmount || 1,
        savingAmount: savingAmount || 0,
        ...(parsedGoalDetails ? { goalMoney: normalizedGoalMoney, savingMoney: normalizedSavingMoney } : {}),
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
    if (!newBudget) throw new Error(t("errors.api.budgetNotIdentified"));
    // Reserve linked accounts before saving the goal. A failed save releases only claims
    // created for this new document, so retries and concurrent requests cannot double-count.
    if (resolvedBudgetType === "saving" && (linkedAccounts || []).length) {
      await claimSavingAccounts({ userId: user, walletId: wallet, budgetId: newBudget._id, accountIds: linkedAccounts || [] });
    }
    let savedBudget: IBudget;
    try {
      savedBudget = await newBudget.save();
    } catch (error) {
      await releaseSavingBudgetClaims(wallet, newBudget._id);
      throw error;
    }
    //IF ERROR
    if (!savedBudget) throw new Error(t("errors.new.budget.was.not.saved"));
    await savedBudget.populate([
      { path: "category", strictPopulate: false },
      { path: "subCategory", strictPopulate: false },
      { path: "categories.category", strictPopulate: false },
      { path: "categories.subCategory", strictPopulate: false },
      { path: "linkedAccounts", strictPopulate: false },
      { path: "linkedTags", strictPopulate: false },
    ]);
    return NextResponse.json({
      message: t("errors.api.created", { p1: savedBudget.name }),
      data: savedBudget,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    const status = e instanceof GoalFundingConflictError || e instanceof InvalidGoalReferenceError ? e.status : 500;
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message, status, ok: false } as never, { status });
  }
}
