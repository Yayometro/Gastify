import mongoose, { Schema } from "mongoose";
import type { ContactFrequency, ContactPattern } from "@gastify/core/transformers/peopleAnalysis";

// A person the spending is around ("Partner", "Mom", "Football team"). The person IS a category (created with it) with its own
// sub-categories; tags, an account and a spending limit can be tied to it too. Movements carry no new field: they belong to a
// person through that category / sub-categories / tags / account (see peopleAnalysis.belongsToPerson). Private data: it lives
// only in the person's own wallet.
export type PersonRelationship = "partner" | "family" | "friend" | "coworker" | "group" | "other";

export interface IPerson extends mongoose.Document {
    user: mongoose.Types.ObjectId | string;
    wallet: mongoose.Types.ObjectId | string;
    name: string;
    relationship: PersonRelationship;
    icon?: string | null;
    color?: string | null;
    category: mongoose.Types.ObjectId | string | null;
    subCategories: (mongoose.Types.ObjectId | string)[];
    tagNames: string[];
    account?: mongoose.Types.ObjectId | string | null;
    contact: { pattern: ContactPattern; days: number[]; frequency: ContactFrequency; typicalMeetingsPerMonth?: number | null };
    limit?: { amount: number; period: "monthly" | "per_meeting" } | null;
    note?: string;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const personSchema = new Schema<IPerson>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
        name: { type: String, required: true, trim: true, maxlength: 40 },
        relationship: { type: String, enum: ["partner", "family", "friend", "coworker", "group", "other"], default: "other" },
        icon: { type: String, default: null },
        color: { type: String, default: null },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
        subCategories: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" }], default: [] },
        tagNames: { type: [String], default: [] },
        account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
        contact: {
            pattern: { type: String, enum: ["weekdays", "weekends", "daily", "random", "custom"], default: "random" },
            days: { type: [Number], default: [] },
            frequency: { type: String, enum: ["daily", "few_per_week", "weekly", "biweekly", "monthly", "sporadic"], default: "sporadic" },
            typicalMeetingsPerMonth: { type: Number, default: null },
        },
        limit: {
            type: new Schema({ amount: { type: Number, required: true }, period: { type: String, enum: ["monthly", "per_meeting"], default: "monthly" } }, { _id: false }),
            default: null,
        },
        note: { type: String, maxlength: 200, default: "" },
        archived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Person: mongoose.Model<IPerson> = mongoose.models.Person || mongoose.model<IPerson>("Person", personSchema);

export default Person;
