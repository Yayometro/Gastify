import mongoose from "mongoose";
import Account from "@/model/Account";
import Budget from "@/model/Budget";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Tag from "@/model/Tag";
import IncomeSource from "@/model/IncomeSource";
import type { GoalDetails } from "@gastify/core/goals/types";
import { isEligibleGoalFundingAccountType } from "@gastify/core/goals/progress";

export class InvalidGoalReferenceError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "InvalidGoalReferenceError";
  }
}

const ids = (values: string[]) => [...new Set(values.filter((value) => mongoose.isValidObjectId(value)))];

/** Reject foreign/stale IDs instead of storing cross-wallet references. */
export async function validateGoalReferences(input: {
  walletId: mongoose.Types.ObjectId | string;
  details: GoalDetails;
  linkedAccountIds: string[];
}): Promise<void> {
  const context = input.details.context;
  const categoryIds = ids(context.categoryIds);
  const subCategoryIds = ids(context.subCategoryIds);
  const tagIds = ids(context.tagIds);
  const spendingBudgetIds = ids(context.spendingBudgetIds);
  const projectBudgetIds = ids(context.projectBudgetIds);
  const accountIds = ids(input.linkedAccountIds);

  const [categories, subCategories, tags, spending, projects, accounts, incomeSource] = await Promise.all([
    Category.countDocuments({ _id: { $in: categoryIds }, $or: [{ wallet: input.walletId }, { isDefaultCatego: true }] }),
    SubCategory.countDocuments({ _id: { $in: subCategoryIds }, $or: [{ wallet: input.walletId }, { isDefaultSubCatego: true }] }),
    Tag.countDocuments({ _id: { $in: tagIds }, wallet: input.walletId }),
    Budget.countDocuments({ _id: { $in: spendingBudgetIds }, wallet: input.walletId, budgetType: "spending" }),
    Budget.countDocuments({ _id: { $in: projectBudgetIds }, wallet: input.walletId, budgetType: "project" }),
    Account.find({ _id: { $in: accountIds }, wallet: input.walletId }).select("_id accountType").lean(),
    input.details.schedule?.incomeSourceId
      ? IncomeSource.countDocuments({ _id: input.details.schedule.incomeSourceId, wallet: input.walletId, archived: { $ne: true } })
      : Promise.resolve(0),
  ]);

  if (categories !== categoryIds.length || subCategories !== subCategoryIds.length || tags !== tagIds.length ||
      spending !== spendingBudgetIds.length || projects !== projectBudgetIds.length || accounts.length !== accountIds.length) {
    throw new InvalidGoalReferenceError("Una categoría, etiqueta, cuenta o presupuesto vinculado ya no está disponible en esta cartera.");
  }
  if (accounts.some((account) => !isEligibleGoalFundingAccountType(account.accountType))) {
    throw new InvalidGoalReferenceError("Las cuentas de crédito no pueden contar como fondos de ahorro. Elige una cuenta de débito, efectivo o ahorro.");
  }
  if (input.details.schedule?.incomeSourceId && incomeSource !== 1) {
    throw new InvalidGoalReferenceError("La fuente de ingreso seleccionada no pertenece a esta cartera o ya no está disponible.");
  }
  for (const value of [...context.categoryIds, ...context.subCategoryIds, ...context.tagIds, ...context.spendingBudgetIds, ...context.projectBudgetIds, ...input.linkedAccountIds]) {
    if (!mongoose.isValidObjectId(value)) throw new InvalidGoalReferenceError("Una referencia seleccionada no tiene un identificador válido.");
  }
}
