import mongoose, { Schema } from "mongoose";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currencies";

// Caches one ECB reference-rate snapshot per (source, baseCurrency, effectiveDate)
// so the app never hits the ECB API on every rendered card - cache-aside, not
// a per-account or per-render external request.
const fxRateSnapshotSchema = new Schema(
  {
    source: { type: String, enum: ["ecb"], required: true, default: "ecb" },
    baseCurrency: { type: String, default: "EUR", required: true },
    effectiveDate: { type: Date, required: true },
    rates: {
      MXN: { type: String, required: true },
      USD: { type: String, required: true },
      EUR: { type: String, required: true },
      JPY: { type: String, required: true },
    },
    fetchedAt: { type: Date, required: true },
    rawSourceDate: { type: String, default: null },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

fxRateSnapshotSchema.index({ source: 1, baseCurrency: 1, effectiveDate: 1 }, { unique: true });

fxRateSnapshotSchema.statics.SUPPORTED_CURRENCIES = SUPPORTED_CURRENCIES;

const FxRateSnapshot =
  mongoose.models.FxRateSnapshot || mongoose.model("FxRateSnapshot", fxRateSnapshotSchema);

export default FxRateSnapshot;
