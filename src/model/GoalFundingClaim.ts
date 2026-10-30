import mongoose, { Schema } from "mongoose";

export interface IGoalFundingClaim extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  wallet: mongoose.Types.ObjectId;
  account: mongoose.Types.ObjectId;
  savingBudget: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const goalFundingClaimSchema = new Schema<IGoalFundingClaim>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
  account: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  savingBudget: { type: Schema.Types.ObjectId, ref: "Budget", required: true },
}, { timestamps: true });

goalFundingClaimSchema.index({ wallet: 1, account: 1 }, { unique: true, name: "unique_goal_funding_account_per_wallet" });
goalFundingClaimSchema.index({ wallet: 1, savingBudget: 1 }, { name: "goal_funding_claims_by_budget" });

const GoalFundingClaim = mongoose.models.GoalFundingClaim as mongoose.Model<IGoalFundingClaim>
  || mongoose.model<IGoalFundingClaim>("GoalFundingClaim", goalFundingClaimSchema);

export default GoalFundingClaim;
