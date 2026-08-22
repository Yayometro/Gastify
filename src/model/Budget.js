import mongoose, { Schema, model } from "mongoose";
import { moneyAmountSchema } from "./schemas/moneySchemas";

const budgetSchema = new Schema({
    name: { type: String },
    isSaving: {type: Boolean},
    // Legacy major-unit amounts. Preserved as the source of truth until
    // Phase 8 (Budgets/Dashboard/charts) migrates consumers to goalMoney/
    // savingMoney.
    savingAmount: { type: Number },
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
    goalAmount: { type: Number },
    isSurpassed: {type: Boolean},
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
    categories: [{
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubCategory",
        },
    }],
    period: {
        type: String,
        enum: ["monthly", "quarterly", "biannual", "yearly"],
        default: "monthly",
    },
    budgetType: {
        type: String,
        enum: ["spending", "saving", "project"],
        default: "spending",
    },
    icon: { type: String },
    eventStartDate: { type: Date },
    eventEndDate: { type: Date },
    linkedTags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
    }],
    linkedAccounts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
    }],
    archived: { type: Boolean, default: false },
    history: [{
        goalAmount: Number,
        savingAmount: Number,
        goalMoney: moneyAmountSchema,
        savingMoney: moneyAmountSchema,
        effectiveFrom: Date,
        effectiveTo: Date,
    }],
    // Multi-currency additions. Optional/additive - existing history[]
    // entries and write routes are unaffected until Phase 8 migrates
    // Budget-consuming reports to use these instead of goalAmount/savingAmount.
    goalMoney: moneyAmountSchema,
    savingMoney: moneyAmountSchema,
  },{ timestamps: true }
);

if (mongoose.models && mongoose.models.Budget) {
  delete mongoose.models.Budget;
}
const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;
