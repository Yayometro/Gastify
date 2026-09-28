import mongoose, { Schema } from "mongoose";
import { moneyAmountSchema } from "./schemas/moneySchemas";

export type IncomeSourceRecurrence = "monthly" | "semimonthly" | "biweekly" | "weekly";

export interface IIncomeSourceHistoryEntry {
  amount?: number;
  money?: {
    amountMinor: number;
    currency: string;
  };
  recurrence?: IncomeSourceRecurrence | string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface IIncomeSource extends mongoose.Document {
  name?: string;
  // Legacy major-unit amount. Preserved until Phase 9 (Projections/
  // IncomeSources) migrates consumers to `money`.
  amount?: number;
  // The currency `amount` is denominated in. Projections converts this to
  // the Wallet's primary currency at build time when they differ.
  currency?: string;
  recurrence?: IncomeSourceRecurrence | string;
  anchorDate?: Date;
  active?: boolean;
  user?: mongoose.Types.ObjectId | string;
  wallet?: mongoose.Types.ObjectId | string;
  archived?: boolean;
  history?: IIncomeSourceHistoryEntry[];
  // Multi-currency addition. Optional/additive.
  money?: {
    amountMinor: number;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const incomeSourceSchema = new Schema<IIncomeSource>(
  {
    name: { type: String },
    // Legacy major-unit amount. Preserved until Phase 9 (Projections/
    // IncomeSources) migrates consumers to `money`.
    amount: { type: Number },
    // The currency `amount` is denominated in. Projections converts this to
    // the Wallet's primary currency at build time when they differ.
    currency: { type: String },
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
    history: [
      {
        amount: Number,
        money: moneyAmountSchema,
        recurrence: String,
        effectiveFrom: Date,
        effectiveTo: Date,
      },
    ],
    // Multi-currency addition. Optional/additive.
    money: moneyAmountSchema,
  },
  { timestamps: true }
);

const IncomeSource: mongoose.Model<IIncomeSource> =
  (mongoose.models.IncomeSource as mongoose.Model<IIncomeSource>) ||
  mongoose.model<IIncomeSource>("IncomeSource", incomeSourceSchema);

export default IncomeSource;
