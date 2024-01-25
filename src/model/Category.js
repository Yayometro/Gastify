import mongoose, {Schema, model} from 'mongoose'

const categorySchema = new Schema({
    name: {type: String},
    icon: {type: String},
    color: {type: String},
    isDefaultCatego: {type: Boolean},
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
    accounts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account"
    }]

}, {timestamps: true})

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema); 

export default Category