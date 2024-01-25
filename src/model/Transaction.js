import mongoose, {Schema, model} from 'mongoose'

const transactionsSchema = new Schema({
    name: {type: String},
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
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
    }]

}, {timestamps: true})


const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionsSchema); 

export default Transaction