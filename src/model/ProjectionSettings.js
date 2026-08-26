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
    }],
    monthlyBuffers: [{
      month: Number, // 0-11
      unexpectedBuffer: Number, // legacy MXN-implicit; preserved until Phase 9
      unexpectedIncomeBuffer: Number, // legacy MXN-implicit; preserved until Phase 9
      expenseMoney: moneyAmountSchema,
      incomeMoney: moneyAmountSchema,
    }],
  },{ timestamps: true }
);

projectionSettingsSchema.index({ wallet: 1, year: 1 }, { unique: true });

const ProjectionSettings =
  mongoose.models.ProjectionSettings ||
  mongoose.model("ProjectionSettings", projectionSettingsSchema);

export default ProjectionSettings;
