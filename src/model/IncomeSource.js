import mongoose, { Schema } from "mongoose";
import { moneyAmountSchema } from "./schemas/moneySchemas";

const incomeSourceSchema = new Schema({
    name: { type: String },
    // Legacy major-unit amount. Preserved until Phase 9 (Projections/
    // IncomeSources) migrates consumers to `money`.
    amount: { type: Number },
    recurrence: {
      type: String,
      enum: ["monthly", "semimonthly", "biweekly", "weekly"],
      default: "monthly",
    },
    anchorDate: { type: Date },
    active: { type: Boolean, default: true },
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
    archived: { type: Boolean, default: false },
    history: [{
        amount: Number,
        money: moneyAmountSchema,
        recurrence: String,
        effectiveFrom: Date,
        effectiveTo: Date,
    }],
    // Multi-currency addition. Optional/additive.
    money: moneyAmountSchema,
  },{ timestamps: true }
);

const IncomeSource = mongoose.models.IncomeSource || mongoose.model("IncomeSource", incomeSourceSchema);

export default IncomeSource;
