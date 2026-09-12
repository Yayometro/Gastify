import dns from "dns";

// The local/ISP DNS resolver intermittently returns EBADRESP for the
// mongodb+srv SRV lookup (confirmed via `dig`, which succeeds against the
// same resolver while Node's c-ares fails) - point Node at public resolvers
// that reliably answer it instead. Shared side-effect module so every Mongo
// client in the process (Mongoose's, and Better Auth's own native driver
// client) gets the override regardless of which one connects first.
dns.setServers(["8.8.8.8", "1.1.1.1"]);
