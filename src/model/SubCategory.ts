import mongoose, {Schema} from 'mongoose'

export interface ISubCategory extends mongoose.Document {
    name?: string;
    icon?: string;
    color?: string;
    isDefaultSubCatego?: boolean;
    user?: mongoose.Types.ObjectId | string;
    wallet?: mongoose.Types.ObjectId | string;
    fatherCategory?: mongoose.Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const subCategorySchema = new Schema<ISubCategory>({
    name: {type: String},
    icon: {type: String},
    color: {type: String},
    isDefaultSubCatego: {type: Boolean},
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet"
    },
    fatherCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        require: true,
    }

}, {timestamps: true})

const SubCategory: mongoose.Model<ISubCategory> = mongoose.models.SubCategory || mongoose.model<ISubCategory>("SubCategory", subCategorySchema); 

export default SubCategory