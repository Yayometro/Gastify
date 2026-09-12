import { auth } from "@/lib/auth/betterAuth";
import { toNextJsHandler } from "better-auth/next-js";

// This route is the very first thing to ever touch betterAuth.js's own
// native MongoClient connection (a second, independent connection from
// Mongoose's dbConnection() used everywhere else) - live in production,
// every request through it was timing out at Vercel's default 10s
// function limit while that first connection got established (Vercel logs
// showed "Task timed out after 10 seconds" on sign-in/social and
// passkey/generate-authenticate-options specifically, nothing else).
// Giving it real room to finish that one-time handshake instead of getting
// killed mid-connect.
export const maxDuration = 30;

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
