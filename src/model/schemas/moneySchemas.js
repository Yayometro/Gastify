import { Schema } from "mongoose";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currencies";

// Reusable embedded Mongoose schemas - these are schema fragments, not
// standalone collections. `{ _id: false }` keeps them from growing their own
// ObjectId when embedded on a parent document.

export const moneyAmountSchema = new Schema(
  {
    amountMinor: { type: Number, required: true },
    currency: { type: String, enum: SUPPORTED_CURRENCIES, required: true },
  },
  { _id: false }
);

export const reportingMoneySchema = new Schema(
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
