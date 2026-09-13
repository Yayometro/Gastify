import "./dnsFix";
import mongoose from "mongoose";

const connectionString = process.env.DB_URI;

if (!connectionString || connectionString.length === 0) {
  throw new Error("Please add your MongoDB URI to env.local");
}

// Single shared connection for the whole process. Mongoose's ODM (used by
// every other route) and Better Auth's native driver queries used to open
// two completely independent MongoClient instances against the same
// cluster - each cold serverless start doubled the sockets it opened,
// which is what drove Atlas's free-tier connection ceiling to 500/500 in
// production (confirmed live in Atlas's own dashboard).
//
// Mongoose sets `mongoose.connection.client` to its real underlying native
// MongoClient synchronously, before the connection actually finishes (see
// NativeConnection.prototype.openUri in
// node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:
// `this.client = client;` runs before `await client.connect();`). Reading
// it back immediately below is safe and gives Better Auth the exact same
// client/pool Mongoose itself uses, instead of a second one - preserving
// the existing lazy-connect pattern (no async singleton dance needed for
// betterAuth.js's synchronous top-level `auth` export).
let connectPromise = null;

export function ensureMongooseConnection() {
  if (!connectPromise) {
    connectPromise = mongoose.connect(connectionString, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
  }
  return connectPromise;
}

export function getSharedMongoClient() {
  ensureMongooseConnection();
  return mongoose.connection.getClient();
}
