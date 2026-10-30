import mongoose from "mongoose";
import Budget from "@/model/Budget";
import Account from "@/model/Account";
import GoalFundingClaim from "@/model/GoalFundingClaim";
import { isEligibleGoalFundingAccountType } from "@gastify/core/goals/progress";

export class GoalFundingConflictError extends Error {
  status = 409;
  constructor(message = "Una cuenta ya está vinculada a otro ahorro. Elige una sola meta o cambia a monto manual.") {
    super(message);
    this.name = "GoalFundingConflictError";
  }
}

const uniqueIds = (values: unknown[] = []): string[] => [...new Set(values.map(value => String((value as { _id?: unknown })?._id ?? value ?? "")).filter(Boolean))];

let indexesReady: Promise<void> | null = null;
async function ensureIndexes(): Promise<void> {
  indexesReady ??= GoalFundingClaim.createIndexes().then(() => undefined).catch((error) => {
    indexesReady = null;
    throw error;
  });
  await indexesReady;
}

export async function claimSavingAccounts(input: {
  userId: mongoose.Types.ObjectId | string;
  walletId: mongoose.Types.ObjectId | string;
  budgetId: mongoose.Types.ObjectId | string;
  accountIds: unknown[];
}): Promise<void> {
  await ensureIndexes();
  const accountIds = uniqueIds(input.accountIds);
  const currentIds = uniqueIds((await GoalFundingClaim.find({ wallet: input.walletId, savingBudget: input.budgetId }).select("account").lean()).map(item => item.account));
  const added: string[] = [];
  try {
    for (const accountId of accountIds) {
      const account = await Account.findOne({ _id: accountId, wallet: input.walletId }).select("_id accountType").lean();
      if (!account) throw new GoalFundingConflictError("Una de las cuentas seleccionadas no pertenece a esta cartera.");
      if (!isEligibleGoalFundingAccountType(account.accountType)) throw new GoalFundingConflictError("Las cuentas de crédito no pueden contar como fondos de ahorro. Elige una cuenta de débito, efectivo o ahorro.");

      const existing = await Budget.findOne({
        wallet: input.walletId,
        _id: { $ne: input.budgetId },
        archived: { $ne: true },
        $or: [{ budgetType: "saving" }, { isSaving: true }],
        linkedAccounts: accountId,
      }).select("_id name").lean();
      if (existing) throw new GoalFundingConflictError(`La cuenta ya financia «${existing.name || "otro ahorro"}». Quita ese vínculo primero.`);

      const priorClaim = await GoalFundingClaim.findOne({ wallet: input.walletId, account: accountId }).lean();
      if (priorClaim && String(priorClaim.savingBudget) !== String(input.budgetId)) {
        const owner = await Budget.findOne({
          _id: priorClaim.savingBudget,
          wallet: input.walletId,
          archived: { $ne: true },
          $or: [{ budgetType: "saving" }, { isSaving: true }],
          linkedAccounts: accountId,
        }).select("_id").lean();
        if (!owner) await GoalFundingClaim.deleteOne({ _id: priorClaim._id });
      }

      const claim = await GoalFundingClaim.findOneAndUpdate(
        { wallet: input.walletId, account: accountId },
        { $setOnInsert: { user: input.userId, wallet: input.walletId, account: accountId, savingBudget: input.budgetId } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      if (String(claim?.savingBudget) !== String(input.budgetId)) throw new GoalFundingConflictError();
      if (!currentIds.includes(accountId)) added.push(accountId);
    }
  } catch (error) {
    if (added.length) await GoalFundingClaim.deleteMany({ wallet: input.walletId, savingBudget: input.budgetId, account: { $in: added } });
    if (error instanceof GoalFundingConflictError) throw error;
    if ((error as { code?: number })?.code === 11000) throw new GoalFundingConflictError();
    throw error;
  }
}

export async function releaseRemovedSavingAccounts(input: { walletId: mongoose.Types.ObjectId | string; budgetId: mongoose.Types.ObjectId | string; keepAccountIds: unknown[] }): Promise<void> {
  await GoalFundingClaim.deleteMany({ wallet: input.walletId, savingBudget: input.budgetId, account: { $nin: uniqueIds(input.keepAccountIds) } });
}

export async function releaseSavingBudgetClaims(walletId: mongoose.Types.ObjectId | string, budgetId: mongoose.Types.ObjectId | string): Promise<void> {
  await GoalFundingClaim.deleteMany({ wallet: walletId, savingBudget: budgetId });
}
