import mongoose, {Schema, model} from 'mongoose'

const subCategorySchema = new Schema({
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

const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', subCategorySchema); 

export default SubCategory