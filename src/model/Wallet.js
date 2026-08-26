import mongoose, {Schema, model} from 'mongoose'
import { SUPPORTED_CURRENCIES } from '@/lib/money/currencies'

const walletSchema = new Schema({
    name: {type: String},
    // Deprecated/legacy - not used by any current consumer, do not add new
    // readers. Preserved during the multi-currency migration only.
    cash: {
        type: Number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    // Deprecated/legacy - superseded by real Budget documents. Preserved
    // during the multi-currency migration only.
    budget: {
        totalBudget: {type: Number},
        totalSavings: {type: Number},
        isSurpassed: {type: Boolean},
        isSaved: {type: Boolean},
    },
    // Multi-currency: controls how totals/reports display for this wallet.
    // Never reinterprets already-stored native money when changed.
    primaryCurrency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: "MXN",
        required: true,
    },
    currencyUpdatedAt: { type: Date, default: null },

}, {timestamps: true})


const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema); 

export default Wallet