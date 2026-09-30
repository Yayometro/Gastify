import { Schema, Types } from "mongoose";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currencies";

export interface IMoneyAmountSchema {
  amountMinor: number;
  currency: string;
}

export type ReportingMoneySource =
  | "same_currency"
  | "legacy_migration"
  | "manual"
  | "ecb_reference"
  | "revolut"
  | "provider_import";

export interface IReportingMoneySchema {
  amountMinor: number;
  currency: string;
  // Target currency per one source currency unit, kept as a string to avoid
  // Decimal128 round-tripping surprises through JSON.
  rate: string;
  source: ReportingMoneySource | string;
  effectiveDate: Date;
  estimated?: boolean;
  snapshot?: Types.ObjectId | string | null;
}

// Reusable embedded Mongoose schemas - these are schema fragments, not
// standalone collections. `{ _id: false }` keeps them from growing their own
// ObjectId when embedded on a parent document.

export const moneyAmountSchema = new Schema<IMoneyAmountSchema>(
  {
    amountMinor: { type: Number, required: true },
    currency: { type: String, enum: SUPPORTED_CURRENCIES, required: true },
  },
  { _id: false }
);

export const reportingMoneySchema = new Schema<IReportingMoneySchema>(
  {
    amountMinor: { type: Number, required: true },
    currency: { type: String, enum: SUPPORTED_CURRENCIES, required: true },
    // Target currency per one source currency unit, kept as a string to avoid
    // Decimal128 round-tripping surprises through JSON.
    rate: { type: String, required: true },
    source: {
      type: String,
      enum: ["same_currency", "legacy_migration", "manual", "ecb_reference", "revolut", "provider_import"],
      required: true,
    },
    effectiveDate: { type: Date, required: true },
    estimated: { type: Boolean, default: false },
    snapshot: { type: Schema.Types.ObjectId, ref: "FxRateSnapshot", default: null },
  },
  { _id: false }
);
