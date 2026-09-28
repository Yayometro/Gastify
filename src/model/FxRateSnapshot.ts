import mongoose, { Schema } from "mongoose";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currencies";

export interface IFxRates {
  MXN: string;
  USD: string;
  EUR: string;
  JPY: string;
  [currency: string]: string | undefined;
}

export interface IFxRateSnapshot extends mongoose.Document {
  source: "ecb" | string;
  baseCurrency: string;
  effectiveDate: Date;
  rates: IFxRates;
  fetchedAt: Date;
  rawSourceDate?: string | null;
  schemaVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFxRateSnapshotModel extends mongoose.Model<IFxRateSnapshot> {
  SUPPORTED_CURRENCIES?: typeof SUPPORTED_CURRENCIES;
}

// Caches one ECB reference-rate snapshot per (source, baseCurrency, effectiveDate)
// so the app never hits the ECB API on every rendered card - cache-aside, not
// a per-account or per-render external request.
const fxRateSnapshotSchema = new Schema<IFxRateSnapshot>(
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

(fxRateSnapshotSchema.statics as Record<string, unknown>).SUPPORTED_CURRENCIES = SUPPORTED_CURRENCIES;

const FxRateSnapshot: IFxRateSnapshotModel =
  (mongoose.models.FxRateSnapshot as IFxRateSnapshotModel) ||
  mongoose.model<IFxRateSnapshot, IFxRateSnapshotModel>("FxRateSnapshot", fxRateSnapshotSchema);

export default FxRateSnapshot;
