
import { ensureMongooseConnection } from "@/lib/db/mongoClient";

// Delegates to the shared connection module so Mongoose and Better Auth's
// native driver end up using the exact same MongoClient/pool instead of
// two independent ones - see src/lib/db/mongoClient.js for why.
export default async function dbConnection() {
    try{
        return await ensureMongooseConnection();
    } catch(e){
        throw new Error(e)
    }
}