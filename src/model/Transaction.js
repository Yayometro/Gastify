import mongoose, {Schema, model} from 'mongoose'
import { moneyAmountSchema, reportingMoneySchema } from './schemas/moneySchemas'

const transactionsSchema = new Schema({
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
transactionsSchema.pre('validate', function (next) {
    if (!this.kind) {
        this.kind = this.isIncome ? 'income' : 'expense';
    }
    if (!this.direction) {
        this.direction = this.kind === 'income' ? 'credit' : 'debit';
    }
    if (!this.money || !this.money.account || !this.money.reporting) {
        const legacyAmountMinor = Math.round(Math.abs(this.amount || 0) * 100);
        this.money = this.money || {};
        if (!this.money.account) {
            this.money.account = { amountMinor: legacyAmountMinor, currency: 'MXN' };
        }
        if (!this.money.reporting) {
            this.money.reporting = {
                amountMinor: legacyAmountMinor,
                currency: 'MXN',
                rate: '1',
                source: 'legacy_migration',
                effectiveDate: this.date || new Date(),
                estimated: false,
            };
        }
    }
    next();
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionsSchema);

export default Transaction
