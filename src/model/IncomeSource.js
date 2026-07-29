import mongoose, { Schema } from "mongoose";

const incomeSourceSchema = new Schema({
    name: { type: String },
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
        recurrence: String,
        effectiveFrom: Date,
        effectiveTo: Date,
    }],
  },{ timestamps: true }
);

const IncomeSource = mongoose.models.IncomeSource || mongoose.model("IncomeSource", incomeSourceSchema);

export default IncomeSource;
