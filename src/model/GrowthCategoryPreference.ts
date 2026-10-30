import mongoose, { Schema } from "mongoose";

export interface IGrowthCategoryPreference extends mongoose.Document {
  wallet: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  reductionPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

// Preferences belong to a wallet, never to a globally shared default category.
const schema = new Schema<IGrowthCategoryPreference>({
  wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  reductionPercent: { type: Number, required: true, min: 1, max: 100 },
}, { timestamps: true });

schema.index({ wallet: 1, category: 1 }, { unique: true });

const GrowthCategoryPreference: mongoose.Model<IGrowthCategoryPreference> =
  mongoose.models.GrowthCategoryPreference || mongoose.model<IGrowthCategoryPreference>("GrowthCategoryPreference", schema);

export default GrowthCategoryPreference;
