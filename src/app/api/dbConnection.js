
import "@/lib/db/dnsFix";
import mongoose from "mongoose";

const connectionString = process.env.DB_URI;

if(!connectionString || connectionString.length === 0) {
    throw new Error('Please add your MongoDB URI to env.local')
}

export default async function dbConnection() {
    try{
        // maxPoolSize caps this connection's own footprint - Mongoose's
        // default (up to 100) times however many concurrent serverless
        // instances Vercel keeps alive is exactly what pushed the Atlas
        // free-tier cluster to "approaching connection limit 100%" and
        // started blocking new connections outright (confirmed live in
        // Atlas's own dashboard). serverSelectionTimeoutMS makes a genuine
        // outage fail with a clear Mongo error inside Vercel's function
        // timeout instead of hanging until Vercel kills the request.
        const data = await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 8000
        });
        return data
    } catch(e){
        throw new Error(e)
    }
}