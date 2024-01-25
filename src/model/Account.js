import mongoose, {Schema, model} from 'mongoose'

const accountSchema = new Schema({
    name: {type: String},
    amount: {type: Number},
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        require: true
    }

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