import mongoose, {Schema, model} from 'mongoose'

const walletSchema = new Schema({
    name: {type: String},
    cash: {
        type: Number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    budget: {
        totalBudget: {type: Number},
        totalSavings: {type: Number},
        isSurpassed: {type: Boolean},
        isSaved: {type: Boolean},
    }

}, {timestamps: true})


const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema); 

export default Wallet