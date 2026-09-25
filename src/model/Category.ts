import mongoose, {Schema} from 'mongoose'

export interface ICategory extends mongoose.Document {
    name?: string;
    icon?: string;
    color?: string;
    isDefaultCatego?: boolean;
    user?: mongoose.Types.ObjectId | string;
    wallet?: mongoose.Types.ObjectId | string;
    accounts?: (mongoose.Types.ObjectId | string)[];
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
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

const Category: mongoose.Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema);

export default Category