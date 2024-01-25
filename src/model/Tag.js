import mongoose, {Schema, model} from 'mongoose'

const tagSchema = new Schema({
    name: {type: String},
    color: {type: String},
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

}, {timestamps: true})


const Tag = mongoose.models.Tag || mongoose.model('Tag', tagSchema); 

export default Tag 
//When a user is created, there's automaticly created:
//A WALLET
// Default ACCOUNT
// A record only one TRANSACCION
// 
