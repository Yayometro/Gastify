import mongoose, { Schema } from "mongoose";

const categoryRuleSchema = new Schema(
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
    minAmount: { type: Number },
    maxAmount: { type: Number },
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

const CategoryRule =
  mongoose.models.CategoryRule || mongoose.model("CategoryRule", categoryRuleSchema);

export default CategoryRule;
