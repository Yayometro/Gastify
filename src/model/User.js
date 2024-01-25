import mongoose, {Schema, model} from 'mongoose'

const userSchema = new Schema({
    fullName: {type: String},
    mail: {type: String, require: true, unique: true},
    password: {type: String, require: true},
    image: {type: String},
    phone: {type: Number},
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        require: true
    },


}, {timestamps: true})

const User = mongoose.models.User || mongoose.model('User', userSchema); //Compile if doesn't exist

export default User