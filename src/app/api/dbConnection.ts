import { ensureMongooseConnection } from "@/lib/db/mongoClient";
import type { Mongoose } from "mongoose";

// Delegates to the shared connection module so Mongoose and Better Auth's
// native driver end up using the exact same MongoClient/pool instead of
// two independent ones - see src/lib/db/mongoClient.js for why.
export default async function dbConnection(): Promise<Mongoose> {
    try{
        return await ensureMongooseConnection();
    } catch(e){
        throw new Error(e as unknown as string)
    }
}