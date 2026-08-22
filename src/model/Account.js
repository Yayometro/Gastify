import mongoose, {Schema, model} from 'mongoose'
import { SUPPORTED_CURRENCIES } from '@/lib/money/currencies'

const accountSchema = new Schema({
    name: {type: String},
    // Legacy major-unit balance. Kept as the source of truth until the
    // migration populates balanceMinor; new money-aware code should prefer
    // balanceMinor once it has been migrated.
    amount: {type: Number},
    accountType: {type: String, enum: ["debit", "credit", "cash", "savings"], default: "debit"},
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        require: true
    },
    // Multi-currency: each Account has exactly one native currency. A
    // Revolut-style multi-currency relationship maps to multiple Accounts,
    // not one Account holding several currencies.
    currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: "MXN",
        required: true,
    },
    balanceMinor: { type: Number, default: null },
    institution: { type: String, default: null },
    balanceUpdatedAt: { type: Date, default: null },
    schemaVersion: { type: Number, default: 1 },

}, {timestamps: true})

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);

export default Account

//When a user is created, there's automaticly created:
//A WALLET
// Default ACCOUNT
// A record only one TRANSACCION
// 

// bank: {
//     name: {type: String},
//     clabe: {type: Number},
//     accountNumber: {type: String}
// },