import mongoose, { Schema } from "mongoose";
import type { RecurrenceFrequency } from "@gastify/core/recurring/recurrence";

// A repeating expense the person declared ("rent, every month"). The charges themselves are ordinary Transactions that carry
// `recurringId` and `recurringDueDate`; this document only says how they repeat and what the last known amount is.
export interface IRecurringExpense extends mongoose.Document {
    user: mongoose.Types.ObjectId | string;
    wallet: mongoose.Types.ObjectId | string;
    name: string;
    // The last confirmed amount, in the currency of the account (major units, like Transaction.amount).
    amount: number;
    currency?: string;
    account?: mongoose.Types.ObjectId | string | null;
    category?: mongoose.Types.ObjectId | string | null;
    subCategory?: mongoose.Types.ObjectId | string | null;
    budget?: mongoose.Types.ObjectId | string | null;
    // Tag NAMES, as the transaction form takes them.
    tags: string[];
    frequency: RecurrenceFrequency;
    // The first occurrence (the date of the charge the rule was made from).
    anchorDate: Date;
    // The date of the last occurrence already created or answered: the next catch-up starts after it.
    lastHandledDate: Date;
    // Answered occurrences (as "YYYY-MM-DD") that are still waiting for an older one to be answered.
    handledKeys: string[];
    // A variable price needs the person to confirm each charge; a fixed one is created by itself.
    isVariable: boolean;
    active: boolean;
    endDate?: Date | null;
    sourceTransaction?: mongoose.Types.ObjectId | string | null;
    createdAt: Date;
    updatedAt: Date;
}

const recurringSchema = new Schema<IRecurringExpense>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        amount: { type: Number, required: true },
        currency: { type: String },
        account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
        subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory", default: null },
        budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget", default: null },
        tags: { type: [String], default: [] },
        frequency: { type: String, enum: ["weekly", "biweekly", "monthly", "bimonthly", "quarterly", "semiannual", "yearly"], required: true },
        anchorDate: { type: Date, required: true },
        lastHandledDate: { type: Date, required: true },
        handledKeys: { type: [String], default: [] },
        isVariable: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
        endDate: { type: Date, default: null },
        sourceTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
    },
    { timestamps: true }
);

const RecurringExpense: mongoose.Model<IRecurringExpense> =
    mongoose.models.RecurringExpense || mongoose.model<IRecurringExpense>("RecurringExpense", recurringSchema);

export default RecurringExpense;
