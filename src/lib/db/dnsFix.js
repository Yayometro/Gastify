import dns from "dns";

// The local/ISP DNS resolver intermittently returns EBADRESP for the
// mongodb+srv SRV lookup (confirmed via `dig`, which succeeds against the
// same resolver while Node's c-ares fails) - point Node at public resolvers
// that reliably answer it instead. Shared side-effect module so every Mongo
// client in the process (Mongoose's, and Better Auth's own native driver
// client) gets the override regardless of which one connects first.
//
// Local-only: Vercel's serverless functions run in their own network
// sandbox with their own (working) DNS path - forcing outbound queries to
// 8.8.8.8/1.1.1.1 there was never verified to work and is the likely cause
// of a real production incident (every Better Auth request timing out at
// Vercel's 10s function limit while its Mongo connection tried to
// establish - see betterAuth.js). `VERCEL` is set automatically in every
// Vercel serverless/edge function, so this never runs there.
if (!process.env.VERCEL) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}
