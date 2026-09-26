import mongoose, { Schema, CallbackError } from 'mongoose'
import { moneyAmountSchema, reportingMoneySchema } from './schemas/moneySchemas'
import { buildLegacyMoney } from '@/lib/money/transactionMoney'

export type TransactionKind = "expense" | "income" | "transfer" | "exchange" | "refund" | "fee";
export type TransactionDirection = "debit" | "credit";
export type TransactionState = "pending" | "completed" | "reverted" | "failed";
export type TransactionTransferDirection = "out" | "in";

export interface IMoneyAmount {
    amountMinor: number;
    currency: string;
}

export interface IReportingMoney {
    amountMinor: number;
    currency: string;
    rate: string;
    source: "same_currency" | "legacy_migration" | "manual" | "ecb_reference" | "revolut" | "provider_import" | string;
    effectiveDate: Date;
    estimated?: boolean;
    snapshot?: mongoose.Types.ObjectId | string | null;
}

export interface ITransactionMoney {
    account?: IMoneyAmount;
    merchant?: IMoneyAmount | null;
    reporting?: IReportingMoney;
}

export interface ITransaction extends mongoose.Document {
    name?: string;
    // Legacy major-unit amount. Kept as the source of truth for old code
    // paths (Phase 5 has not yet updated every write route) until the
    // migration + route updates land; new reads should prefer money.*.
    amount?: number;
    isIncome?: boolean;
    isBill?: boolean;
    isReadable?: boolean;
    isForSaving?: boolean;
    date?: Date;
    user?: mongoose.Types.ObjectId | string;
    wallet?: mongoose.Types.ObjectId | string;
    account?: mongoose.Types.ObjectId | string;
    category?: mongoose.Types.ObjectId | string;
    subCategory?: mongoose.Types.ObjectId | string;
    budget?: mongoose.Types.ObjectId | string;
    tags?: (mongoose.Types.ObjectId | string)[];

    // --- Multi-currency additions ---
    kind?: TransactionKind | string;
    direction?: TransactionDirection | string;
    state?: TransactionState | string;
    money?: ITransactionMoney;
    transferGroupId?: string | null;
    transferDirection?: TransactionTransferDirection | null | string;
    schemaVersion?: number;
    createdAt: Date;
    updatedAt: Date;
}

const transactionsSchema = new Schema<ITransaction>({
    name: {type: String},
    // Legacy major-unit amount. Kept as the source of truth for old code
    // paths (Phase 5 has not yet updated every write route) until the
    // migration + route updates land; new reads should prefer money.*.
    amount: {type: Number, require: true},
    isIncome: {type: Boolean},
    isBill: {type: Boolean},
    isReadable: {type: Boolean},
    isForSaving: {type: Boolean},
    date: {type: Date},
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account"
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
    budget: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Budget",
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
    }],

    // --- Multi-currency additions ---
    kind: {
        type: String,
        enum: ["expense", "income", "transfer", "exchange", "refund", "fee"],
        required: true,
    },
    direction: {
        type: String,
        enum: ["debit", "credit"],
        required: true,
    },
    state: {
        type: String,
        enum: ["pending", "completed", "reverted", "failed"],
        default: "completed",
    },
    money: {
        account: moneyAmountSchema,
        merchant: moneyAmountSchema,
        reporting: reportingMoneySchema,
    },
    transferGroupId: { type: String, default: null },
    transferDirection: { type: String, enum: ["out", "in"], default: null },
    schemaVersion: { type: Number, default: 1 },

}, {timestamps: true})

// Backward-compatibility safety net: kind/direction/money are required by
// the schema (the multi-currency end state), but write routes are migrated
// gradually (see Phase 5 in .mds/MULTI_CURRENCY_IMPLEMENTATION_PLAN.md).
// Until a given route is updated to set these explicitly, derive them from
// the legacy isBill/isIncome/amount fields here, defaulting to MXN at rate 1
// (matching the plan's own legacy-migration assumption) so existing reads/
// writes keep working during the transition instead of throwing a
// validation error. Once every write route is migrated this becomes a
// harmless no-op for the fields it never needs to fill in.
transactionsSchema.pre('validate', function (this: ITransaction, next: (err?: CallbackError) => void) {
    if (!this.kind) {
        this.kind = this.isIncome ? 'income' : 'expense';
    }
    if (!this.direction) {
        this.direction = this.kind === 'income' ? 'credit' : 'debit';
    }
    if (!this.money || !this.money.account || !this.money.reporting) {
        const legacy = buildLegacyMoney({ amount: this.amount, date: this.date });
        this.money = this.money || {};
        if (!this.money.account) {
            this.money.account = legacy.account;
        }
        if (!this.money.reporting) {
            this.money.reporting = legacy.reporting;
        }
    }
    next();
});

const Transaction: mongoose.Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionsSchema);

export default Transaction
