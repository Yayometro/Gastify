import mongoose, {Schema} from 'mongoose'

export interface IUser extends mongoose.Document {
    fullName?: string;
    mail: string;
    image?: string;
    phone?: number;
    language?: "es" | "en" | null;
    country?: string | null;
    wallet: mongoose.Types.ObjectId;
    apiTokens: {
        name: string;
        tokenHash: string;
        createdAt: Date;
        lastUsedAt: Date | null;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    fullName: {type: String},
    mail: {type: String, require: true, unique: true},
    image: {type: String},
    phone: {type: Number},
    // The language and the country the person chose in the profile. Declared here so Mongoose keeps them on update (strict
    // mode drops any field the schema does not know). null means automatic: the language follows the country.
    language: {type: String, enum: ["es", "en", null], default: null},
    country: {type: String, default: null},
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        require: true
    },
    // Personal access tokens for third-party AI-agent connectors (e.g. a
    // Claude/ChatGPT connector calling Gastify's MCP server). Only the
    // SHA-256 hash is ever stored - the raw token is shown once at creation
    // and cannot be recovered. See .mds/AI_AGENT_CONNECTOR_PLAN.md.
    apiTokens: [{
        name: { type: String, required: true },
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: { type: Date, default: null },
    }],

}, {timestamps: true})

const User: mongoose.Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema); //Compile if doesn't exist

export default User
