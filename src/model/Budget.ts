import mongoose, { Schema } from "mongoose";
import { moneyAmountSchema } from "./schemas/moneySchemas";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currencies";

export interface IBudgetCategoryEntry {
    category?: mongoose.Types.ObjectId | string;
    subCategory?: mongoose.Types.ObjectId | string;
}

export interface IBudgetHistoryEntry {
    goalAmount?: number;
    savingAmount?: number;
    goalMoney?: {
        amountMinor: number;
        currency: string;
    };
    savingMoney?: {
        amountMinor: number;
        currency: string;
    };
    effectiveFrom?: Date;
    effectiveTo?: Date;
}

export interface IBudget extends mongoose.Document {
    name?: string;
    isSaving?: boolean;
    // Legacy major-unit amounts. Preserved as the source of truth until
    // Phase 8 (Budgets/Dashboard/charts) migrates consumers to goalMoney/
    // savingMoney.
    savingAmount?: number;
    user?: mongoose.Types.ObjectId | string;
    wallet?: mongoose.Types.ObjectId | string;
    goalAmount?: number;
    isSurpassed?: boolean;
    category?: mongoose.Types.ObjectId | string;
    subCategory?: mongoose.Types.ObjectId | string;
    categories?: IBudgetCategoryEntry[];
    period?: "monthly" | "quarterly" | "biannual" | "yearly" | string;
    budgetType?: "spending" | "saving" | "project" | string;
    icon?: string;
    eventStartDate?: Date;
    eventEndDate?: Date;
    linkedTags?: (mongoose.Types.ObjectId | string)[];
    linkedAccounts?: (mongoose.Types.ObjectId | string)[];
    archived?: boolean;
    history?: IBudgetHistoryEntry[];
    // Multi-currency additions. Optional/additive - existing history[]
    // entries and write routes are unaffected until Phase 8 migrates
    // Budget-consuming reports to use these instead of goalAmount/savingAmount.
    goalMoney?: {
        amountMinor: number;
        currency: string;
    };
    savingMoney?: {
        amountMinor: number;
        currency: string;
    };
    // Display-only label of which currency this Budget's numbers are meant
    // to be read in. Defaults to the Wallet's primary currency at creation
    // time. Does NOT convert or affect any calculation - matching/coverage
    // math still operates on raw legacy amounts (see Phase 8/9 in
    // MULTI_CURRENCY_IMPLEMENTATION_PLAN.md for the real conversion work).
    currency?: string;
    createdAt: Date;
    updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>({
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
    // Display-only label of which currency this Budget's numbers are meant
    // to be read in. Defaults to the Wallet's primary currency at creation
    // time. Does NOT convert or affect any calculation - matching/coverage
    // math still operates on raw legacy amounts (see Phase 8/9 in
    // MULTI_CURRENCY_IMPLEMENTATION_PLAN.md for the real conversion work).
    currency: { type: String, enum: SUPPORTED_CURRENCIES },
  },{ timestamps: true }
);

if (mongoose.models && mongoose.models.Budget) {
  delete mongoose.models.Budget;
}
const Budget: mongoose.Model<IBudget> = mongoose.model<IBudget>("Budget", budgetSchema);

export default Budget;
