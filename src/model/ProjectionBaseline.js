import mongoose, { Schema } from "mongoose";
import { moneyAmountSchema } from "./schemas/moneySchemas";

// One document per wallet (not per year) - a rough, user-entered timeline of
// concurrent income periods and, independently, expense periods, used only
// to fill in Projections for months/years with no real Budgets, Income
// Sources, or transactions logged at all. Income and expense are tracked as
// two separate lists (not one combined entry) because they don't
// necessarily change at the same time - e.g. a raise doesn't imply rent
// changed that same month.
//
// Unlike Budget.history/IncomeSource.history (which replace one another -
// only the latest entry as of a date applies), entries here are additive:
// each has its own [effectiveFrom, effectiveTo) window, and every entry
// whose window covers a given month is SUMMED - this lets two simultaneous
// jobs (e.g. a steady one since 2022 plus a second one that started later)
// both count toward that month's total instead of the newer one silently
// replacing the older one. effectiveTo left unset means "still ongoing".
const projectionBaselineSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      require: true,
    },
    incomeHistory: [{
      effectiveFrom: Date,
      effectiveTo: Date,
      incomeMoney: moneyAmountSchema,
    }],
    expenseHistory: [{
      effectiveFrom: Date,
      effectiveTo: Date,
      expenseMoney: moneyAmountSchema,
    }],
  },
  { timestamps: true }
);

projectionBaselineSchema.index({ wallet: 1 }, { unique: true });

const ProjectionBaseline =
  mongoose.models.ProjectionBaseline ||
  mongoose.model("ProjectionBaseline", projectionBaselineSchema);

export default ProjectionBaseline;
