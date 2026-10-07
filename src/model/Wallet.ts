import mongoose, {Schema} from 'mongoose'
import { SUPPORTED_CURRENCIES } from '@/lib/money/currencies'

export interface IWalletBudget {
    totalBudget?: number;
    totalSavings?: number;
    isSurpassed?: boolean;
    isSaved?: boolean;
}

export interface IWallet extends mongoose.Document {
    name?: string;
    // Deprecated/legacy - not used by any current consumer, do not add new
    // readers. Preserved during the multi-currency migration only.
    cash?: number;
    user?: mongoose.Types.ObjectId | string;
    // Deprecated/legacy - superseded by real Budget documents. Preserved
    // during the multi-currency migration only.
    budget?: IWalletBudget;
    // Multi-currency: controls how totals/reports display for this wallet.
    // Never reinterprets already-stored native money when changed.
    primaryCurrency?: string;
    currencyUpdatedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const walletSchema = new Schema<IWallet>({
    name: {type: String},
    // Deprecated/legacy - not used by any current consumer, do not add new
    // readers. Preserved during the multi-currency migration only.
    cash: {
        type: Number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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


const Wallet: mongoose.Model<IWallet> = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', walletSchema); 

export default Wallet