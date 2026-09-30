import mongoose, { Schema } from "mongoose";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currencies";

export interface ICategoryRuleCategoryRef {
  _id?: mongoose.Types.ObjectId | string | unknown;
  name?: string;
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

export interface ICategoryRule extends mongoose.Document {
  user?: mongoose.Types.ObjectId | string;
  wallet?: mongoose.Types.ObjectId | string;
  pattern?: string;
  // Legacy major-unit thresholds, implicitly MXN. Preserved until Phase 8
  // migrates categoryRuleMatcher to compare against minAmountMinor/
  // maxAmountMinor in amountCurrency instead.
  minAmount?: number;
  maxAmount?: number;
  minAmountMinor?: number | null;
  maxAmountMinor?: number | null;
  amountCurrency?: string;
  category?: mongoose.Types.ObjectId | string | ICategoryRuleCategoryRef;
  subCategory?: mongoose.Types.ObjectId | string | ICategoryRuleCategoryRef;
  // Higher priority is evaluated first, so a specific rule (e.g. "UBER EATS")
  // can win over a broader one that would otherwise also match (e.g. "UBER").
  priority?: number;
  // "low" confidence rules (e.g. a department store that sells many kinds of
  // things) should be surfaced for closer review rather than one-click applied.
  confidence?: "high" | "low" | string;
  source?: "seed" | "manual" | "learned" | string;
  timesApplied?: number;
  createdAt: Date;
  updatedAt: Date;
}

const categoryRuleSchema = new Schema<ICategoryRule>(
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
    pattern: { type: String, require: true },
    // Legacy major-unit thresholds, implicitly MXN. Preserved until Phase 8
    // migrates categoryRuleMatcher to compare against minAmountMinor/
    // maxAmountMinor in amountCurrency instead.
    minAmount: { type: Number },
    maxAmount: { type: Number },
    minAmountMinor: { type: Number, default: null },
    maxAmountMinor: { type: Number, default: null },
    amountCurrency: { type: String, enum: SUPPORTED_CURRENCIES, default: "MXN" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },
    // Higher priority is evaluated first, so a specific rule (e.g. "UBER EATS")
    // can win over a broader one that would otherwise also match (e.g. "UBER").
    priority: { type: Number, default: 0 },
    // "low" confidence rules (e.g. a department store that sells many kinds of
    // things) should be surfaced for closer review rather than one-click applied.
    confidence: { type: String, enum: ["high", "low"], default: "high" },
    source: { type: String, enum: ["seed", "manual", "learned"], default: "manual" },
    timesApplied: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categoryRuleSchema.index({ wallet: 1, priority: -1 });

const CategoryRule: mongoose.Model<ICategoryRule> =
  mongoose.models.CategoryRule || mongoose.model<ICategoryRule>("CategoryRule", categoryRuleSchema);

export default CategoryRule;
