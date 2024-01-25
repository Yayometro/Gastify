
import mongoose from "mongoose";

const connectionString = process.env.DB_URI;

if(!connectionString || connectionString.length === 0) {
    throw new Error('Please add your MongoDB URI to env.local')
}

export default async function dbConnection() {
    try{
        const data = await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`Database connected to ----> ${connectionString}`)
        return data
    } catch(e){
        throw new Error(e)
    }
}