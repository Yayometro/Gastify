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
    categories: [{
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubCategory",
        },
    }],
    period: {
        type: String,
        enum: ["monthly", "quarterly", "biannual", "yearly"],
        default: "monthly",
    },
    linkedAccounts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
    }],
    archived: { type: Boolean, default: false },
    history: [{
        goalAmount: Number,
        savingAmount: Number,
        effectiveFrom: Date,
        effectiveTo: Date,
    }],
  },{ timestamps: true }
);

if (mongoose.models && mongoose.models.Budget) {
  delete mongoose.models.Budget;
}
const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;
