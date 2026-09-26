import mongoose, {Schema} from 'mongoose'

export interface ITag extends mongoose.Document {
    name?: string;
    color?: string;
    user?: mongoose.Types.ObjectId | string;
    wallet?: mongoose.Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const tagSchema = new Schema<ITag>({
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


const Tag: mongoose.Model<ITag> = mongoose.models.Tag || mongoose.model<ITag>('Tag', tagSchema); 

export default Tag 
//When a user is created, there's automaticly created:
//A WALLET
// Default ACCOUNT
// A record only one TRANSACCION
// 
