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
import { claimSavingAccounts, GoalFundingConflictError, releaseRemovedSavingAccounts, releaseSavingBudgetClaims } from "@/lib/goals/fundingClaims";
import type { GoalDetails } from "@gastify/core/goals/types";

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
  color?: string | null;
  goalDetails?: unknown;
  goalMoney?: { amountMinor: number; currency: string } | null;
  savingMoney?: { amountMinor: number; currency: string } | null;
  expectedRevision?: number;
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
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on.9"));
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
      color,
      goalDetails,
      goalMoney,
      savingMoney,
      expectedRevision,
    } = (await request.json()) as UpdateBudgetRequestBody;
    if (!id) throw new Error(t("errors.api.noIdUpdateBudget"));
    // Security fix: this used to look up the Budget by id alone, with zero
    // ownership check - this endpoint isn't covered by middleware.ts's
    // matcher, so any caller could edit any other user's budget. Now the
    // lookup is scoped to the caller's own wallet (session-derived), so an
    // id belonging to someone else's budget fails the same "not found"
    // check as a bogus id.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.on.update.4"));
    // FIND WALLET and UPDATE
    const updateBudget = await Budget.findOne({ _id: id, wallet: userFound.wallet });
    //IF ERROR
    if (!updateBudget) throw new Error(t("errors.api.budgetNotIdentifiedUpdate"));
    const existingLinkedIds = (updateBudget.linkedAccounts || []).map((item) => String((item as { _id?: unknown })?._id ?? item));
    if (expectedRevision !== undefined && Number(expectedRevision) !== Number(updateBudget.revision || 0)) {
      return NextResponse.json({ message: "Este objetivo cambió en otro dispositivo. Recarga la página antes de guardar.", status: 409, ok: false } as never, { status: 409 });
    }
    const effectiveType = budgetType ?? updateBudget.budgetType ?? (updateBudget.isSaving ? "saving" : "spending");
    if (!["spending", "saving", "project"].includes(effectiveType)) {
      return NextResponse.json({ message: "El tipo de presupuesto no es válido.", status: 400, ok: false } as never, { status: 400 });
    }
    const oldCurrency = updateBudget.currency || "MXN";
    const nextCurrency = currency || oldCurrency;
    if (!isSupportedCurrency(nextCurrency)) {
      return NextResponse.json({ message: "La moneda seleccionada no está disponible.", status: 400, ok: false } as never, { status: 400 });
    }
    if (updateBudget.goalDetails && effectiveType !== "saving") {
      return NextResponse.json({ message: "Primero convierte este objetivo en ahorro simple antes de cambiar su tipo.", status: 409 } as never, { status: 409 });
    }
    if (linkedAccounts !== undefined && (!Array.isArray(linkedAccounts) || linkedAccounts.length > 100)) {
      return NextResponse.json({ message: "La lista de cuentas vinculadas no es válida.", status: 400, ok: false } as never, { status: 400 });
    }
    if (currency !== undefined && currency !== oldCurrency && (goalAmount === undefined || savingAmount === undefined)) {
      return NextResponse.json({ message: "Para cambiar la moneda, vuelve a enviar los importes ya convertidos y confírmalos.", status: 400, ok: false } as never, { status: 400 });
    }
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ message: "El color del objetivo no es válido.", status: 400, ok: false } as never, { status: 400 });
    }
    if (updateBudget.goalDetails && currency !== undefined && currency !== oldCurrency && goalDetails === undefined) {
      return NextResponse.json({ message: "Vuelve a enviar los datos del objetivo ya convertidos para cambiar su moneda.", status: 400, ok: false } as never, { status: 400 });
    }
    let parsedGoalDetails: GoalDetails | null | undefined;
    if (goalDetails === null) {
      parsedGoalDetails = null;
    } else if (goalDetails !== undefined) {
      const parsed = parseGoalDetails(goalDetails);
      if (!parsed.success || !validateGoalDetailsDates(parsed.data) || effectiveType !== "saving") {
        return NextResponse.json({ message: "Los datos del objetivo no son válidos o solo se pueden asociar a un ahorro.", status: 400, ok: false } as never, { status: 400 });
      }
      const nextGoal = goalAmount !== undefined ? Number(goalAmount) : Number(updateBudget.goalAmount || 0);
      const nextSaving = savingAmount !== undefined ? Number(savingAmount) : Number(updateBudget.savingAmount || 0);
      if (!Number.isFinite(nextGoal) || nextGoal <= 0 || !Number.isFinite(nextSaving) || nextSaving < 0 || !Number.isSafeInteger(majorToMinor(nextGoal, nextCurrency)) || !Number.isSafeInteger(majorToMinor(nextSaving, nextCurrency)) || (goalMoney && (goalMoney.currency !== nextCurrency || !Number.isSafeInteger(goalMoney.amountMinor) || goalMoney.amountMinor <= 0))) {
        return NextResponse.json({ message: "La meta debe ser mayor que cero y conservar su moneda.", status: 400, ok: false } as never, { status: 400 });
      }
      const nextGoalMoney = goalMoney || { amountMinor: majorToMinor(nextGoal, nextCurrency), currency: nextCurrency };
      const nextSavingMoney = savingMoney || { amountMinor: majorToMinor(nextSaving, nextCurrency), currency: nextCurrency };
      if (nextGoalMoney.currency !== nextCurrency || !Number.isSafeInteger(nextGoalMoney.amountMinor) || nextGoalMoney.amountMinor !== majorToMinor(nextGoal, nextCurrency) ||
          nextSavingMoney.currency !== nextCurrency || !Number.isSafeInteger(nextSavingMoney.amountMinor) || nextSavingMoney.amountMinor !== majorToMinor(nextSaving, nextCurrency)) {
        return NextResponse.json({ message: "Los montos estructurados no coinciden con los montos de la meta.", status: 400, ok: false } as never, { status: 400 });
      }
      if (!validateGoalFinancialDetails(nextGoal, nextCurrency, parsed.data)) {
        return NextResponse.json({ message: "Revisa la meta, el precio, el enganche y las aportaciones antes de guardar.", status: 400, ok: false } as never, { status: 400 });
      }
      const nextLinkedAccounts = linkedAccounts !== undefined ? linkedAccounts : updateBudget.linkedAccounts || [];
      if (nextLinkedAccounts.length > 0 && nextSaving > 0) {
        return NextResponse.json({ message: "Elige saldo manual o cuentas vinculadas, no ambos.", status: 400, ok: false } as never, { status: 400 });
      }
      await validateGoalReferences({ walletId: userFound.wallet, details: parsed.data, linkedAccountIds: nextLinkedAccounts.map(String) });
      parsedGoalDetails = parsed.data;
    }
    const resultingGoalDetails = parsedGoalDetails === undefined ? updateBudget.goalDetails || null : parsedGoalDetails;
    if (resultingGoalDetails) {
      const nextGoal = goalAmount !== undefined ? Number(goalAmount) : Number(updateBudget.goalAmount || 0);
      const nextSaving = savingAmount !== undefined ? Number(savingAmount) : Number(updateBudget.savingAmount || 0);
      if (effectiveType !== "saving" || !validateGoalMoneyPair(nextGoal, nextCurrency) || !validateGoalSavingMoneyPair(nextSaving, nextCurrency) ||
          (goalMoney !== undefined && !validateGoalMoneyPair(nextGoal, nextCurrency, goalMoney)) ||
          (savingMoney !== undefined && !validateGoalSavingMoneyPair(nextSaving, nextCurrency, savingMoney)) ||
          !validateGoalFinancialDetails(nextGoal, nextCurrency, resultingGoalDetails)) {
        return NextResponse.json({ message: "Revisa la meta, el precio, el enganche y las aportaciones antes de guardar.", status: 400, ok: false } as never, { status: 400 });
      }
    }
    // Keep a snapshot whenever money, currency, or goal-plan details change.
    const amountIsChanging =
      (goalAmount !== undefined && Number(goalAmount) !== Number(updateBudget.goalAmount)) ||
      (savingAmount !== undefined && Number(savingAmount) !== Number(updateBudget.savingAmount));
    const oldGoalDetails = updateBudget.goalDetails || null;
    const nextGoalDetails = parsedGoalDetails === undefined ? oldGoalDetails : parsedGoalDetails;
    const goalDetailsChanged = JSON.stringify(oldGoalDetails) !== JSON.stringify(nextGoalDetails || null);
    const currencyChanged = nextCurrency !== oldCurrency;
    if (amountIsChanging || goalDetailsChanged || currencyChanged) {
      const now = new Date();
      const openEntry = updateBudget.history?.find((h) => !h.effectiveTo);
      if (openEntry) openEntry.effectiveTo = now;
      updateBudget.history = updateBudget.history || [];
      const nextGoalAmount = goalAmount !== undefined ? Number(goalAmount) : Number(updateBudget.goalAmount || 0);
      const nextSavingAmount = savingAmount !== undefined ? Number(savingAmount) : Number(updateBudget.savingAmount || 0);
      updateBudget.history.push({
        goalAmount: nextGoalAmount,
        savingAmount: nextSavingAmount,
        ...(nextGoalDetails ? {
          goalMoney: goalMoney || { amountMinor: majorToMinor(nextGoalAmount, nextCurrency), currency: nextCurrency },
          savingMoney: savingMoney || { amountMinor: majorToMinor(nextSavingAmount, nextCurrency), currency: nextCurrency },
          goalDetails: nextGoalDetails,
        } : {}),
        currency: nextCurrency,
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
    if (icon !== undefined) updateBudget.icon = icon || "fluent/airplane";
    if (currency !== undefined) updateBudget.currency = nextCurrency;
    if (color !== undefined) updateBudget.color = color || undefined;
    if (parsedGoalDetails !== undefined) updateBudget.goalDetails = parsedGoalDetails || undefined;
    if (updateBudget.goalDetails) {
      updateBudget.goalMoney = goalMoney || { amountMinor: majorToMinor(Number(updateBudget.goalAmount || 0), nextCurrency), currency: nextCurrency };
      updateBudget.savingMoney = savingMoney || { amountMinor: majorToMinor(Number(updateBudget.savingAmount || 0), nextCurrency), currency: nextCurrency };
    } else if (parsedGoalDetails === null) {
      updateBudget.goalMoney = undefined;
      updateBudget.savingMoney = undefined;
    }
    if (parsedGoalDetails !== undefined || updateBudget.goalDetails) updateBudget.revision = Number(updateBudget.revision || 0) + 1;
    if (eventStartDate !== undefined) {
      updateBudget.eventStartDate = eventStartDate ? new Date(eventStartDate) : null;
    }
    if (eventEndDate !== undefined) {
      updateBudget.eventEndDate = eventEndDate ? new Date(eventEndDate) : null;
    }
    const oldLinkedIds = existingLinkedIds;
    const nextLinkedIds = linkedAccounts !== undefined ? linkedAccounts.map(String) : oldLinkedIds;
    const reservesAccounts = effectiveType === "saving" && nextLinkedIds.length > 0;
    if (reservesAccounts) {
      await claimSavingAccounts({ userId: userFound._id, walletId: userFound.wallet, budgetId: updateBudget._id, accountIds: nextLinkedIds });
    }
    // SAVE
    if (expectedRevision !== undefined) {
      const expected = Number(expectedRevision);
      (updateBudget as unknown as { $where: Record<string, unknown> }).$where = expected === 0
        ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] }
        : { revision: expected };
    }
    let savedBudget: IBudget;
    try {
      savedBudget = await updateBudget.save();
    } catch (error) {
      if (reservesAccounts) await releaseRemovedSavingAccounts({ walletId: userFound.wallet, budgetId: updateBudget._id, keepAccountIds: oldLinkedIds });
      if (expectedRevision !== undefined && error instanceof Error && error.name === "VersionError") {
        return NextResponse.json({ message: "Este objetivo cambió en otro dispositivo. Recarga la página antes de guardar.", status: 409, ok: false } as never, { status: 409 });
      }
      throw error;
    }
    if (reservesAccounts) {
      await releaseRemovedSavingAccounts({ walletId: userFound.wallet, budgetId: savedBudget._id, keepAccountIds: nextLinkedIds });
    } else {
      await releaseSavingBudgetClaims(userFound.wallet, savedBudget._id);
    }
    //IF ERROR
    if (!savedBudget) throw new Error(t("errors.updated.budget.was.not.saved"));
    await savedBudget.populate([
      { path: "category", strictPopulate: false },
      { path: "subCategory", strictPopulate: false },
      { path: "categories.category", strictPopulate: false },
      { path: "categories.subCategory", strictPopulate: false },
      { path: "linkedAccounts", strictPopulate: false },
      { path: "linkedTags", strictPopulate: false },
    ]);
    return NextResponse.json({
      message: t("errors.api.updated", { p1: savedBudget.name }),
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
