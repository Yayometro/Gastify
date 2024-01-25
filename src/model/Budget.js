import mongoose, { Schema, model } from "mongoose";

const budgetSchema = new Schema({
    name: { type: String },
    isSaving: {type: Boolean},
    savingAmount: { type: Number },
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
    goalAmount: { type: Number },
    isSurpassed: {type: Boolean},
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
  },{ timestamps: true }
);

const Budget = mongoose.models.Budget || mongoose.model("Budget", budgetSchema);

export default Budget;
