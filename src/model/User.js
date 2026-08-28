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

const User = mongoose.models.User || mongoose.model('User', userSchema); //Compile if doesn't exist

export default User