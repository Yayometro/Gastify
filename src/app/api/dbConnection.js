
import dns from "dns";
import mongoose from "mongoose";

const connectionString = process.env.DB_URI;

if(!connectionString || connectionString.length === 0) {
    throw new Error('Please add your MongoDB URI to env.local')
}

// The local/ISP DNS resolver intermittently returns EBADRESP for the
// mongodb+srv SRV lookup (confirmed via `dig`, which succeeds against the
// same resolver while Node's c-ares fails) - point Node at public resolvers
// that reliably answer it instead.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export default async function dbConnection() {
    try{
        const data = await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        return data
    } catch(e){
        throw new Error(e)
    }
}