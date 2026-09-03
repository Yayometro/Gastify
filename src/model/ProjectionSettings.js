import mongoose, { Schema } from "mongoose";
import { moneyAmountSchema } from "./schemas/moneySchemas";

const projectionSettingsSchema = new Schema({
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
    year: { type: Number, require: true },
    monthlyBalances: [{
      month: Number, // 0-11
      balance: Number, // legacy MXN-implicit; preserved until Phase 9
      money: moneyAmountSchema,
      // Append-only log of every value this entry has ever had, so a later
      // edit never silently rewrites what was set at an earlier point in time.
      revisions: [{
        balance: Number,
        money: moneyAmountSchema,
        updatedAt: Date,
      }],
    }],
    monthlyBuffers: [{
      month: Number, // 0-11
      unexpectedBuffer: Number, // legacy MXN-implicit; preserved until Phase 9
      unexpectedIncomeBuffer: Number, // legacy MXN-implicit; preserved until Phase 9
      expenseMoney: moneyAmountSchema,
      incomeMoney: moneyAmountSchema,
      // Same append-only log as monthlyBalances.revisions above - this is
      // what lets a closed month's "what was projected back then" stay
      // correct even if the buffer is edited again after the month ends.
      revisions: [{
        unexpectedBuffer: Number,
        unexpectedIncomeBuffer: Number,
        expenseMoney: moneyAmountSchema,
        incomeMoney: moneyAmountSchema,
        updatedAt: Date,
      }],
    }],
  },{ timestamps: true }
);

projectionSettingsSchema.index({ wallet: 1, year: 1 }, { unique: true });

const ProjectionSettings =
  mongoose.models.ProjectionSettings ||
  mongoose.model("ProjectionSettings", projectionSettingsSchema);

export default ProjectionSettings;
