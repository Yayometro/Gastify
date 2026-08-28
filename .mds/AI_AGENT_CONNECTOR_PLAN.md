# AI Agent Connector Plan (voice-driven transaction creation)

**Status:** Phase 4 done - real Claude connector added from claude.ai, verified end-to-end from
both the web app and a fresh chat (confirming stateless per-request auth works with no shared
context needed between chats), including a real transaction created and confirmed in the app UI.
Tools were then consolidated based on Luis's live-testing feedback (see below). Next: whichever
of the "Future phases" below Luis wants to prioritize.
**Owner:** Luis, implemented by Claude Code

## Motivation

The existing voice-transaction feature (`VoiceRecognicionComponent.jsx` + `speech-add/route.js`)
is bad: it uses the browser's free `webkitSpeechRecognition` (no quality control, a locale typo)
and a brittle hand-rolled regex parser that only matches near-exact English phrasing. Paying for
a proper STT + LLM-extraction pipeline (Groq/Deepgram + Claude/GPT-4o-mini) would work, but has
an ongoing per-call cost.

**The chosen alternative:** instead of Gastify paying for speech-to-text and language
understanding, expose Gastify as a **remote connector/plugin** that AI agents (Claude first,
ChatGPT later) can call directly. The user talks to their own Claude/ChatGPT app (mobile
included) using their own subscription's voice mode and reasoning - the agent extracts the
transaction details itself and calls Gastify's connector with clean, structured data. Gastify's
server does zero speech-to-text and zero LLM inference; it only validates and writes the
transaction. Ongoing cost to Gastify: effectively $0.

This is a **remote** MCP server (like Booking.com's, Outlook's, or Vercel's own connectors) -
hosted on Gastify's existing always-on Vercel deployment. It has nothing to do with a **local**
MCP server (the kind Claude Desktop spawns as a local process); the user's own machine does not
need to be running anything.

## Platform support (verified before committing to this)

| Platform | Mobile app support | Caveat |
|---|---|---|
| **Claude** | ✅ Confirmed since July 2025 - custom connectors work from the iOS/Android app for day-to-day use | Adding/configuring a new connector's URL must be done once from claude.ai on web/desktop first; can't add it from the phone. Usage afterward (including voice) works fine from mobile. |
| **ChatGPT** | ⚠️ Custom GPTs work on mobile with excellent native voice (GPT-Live), but there are active community reports of **Custom GPT Actions not firing reliably on the Android app** | Safer on iOS; treat as a Phase 2 target once the Android bug is confirmed fixed or if usage is iOS-only. |
| **Gemini** | ❌ Unclear | Custom MCP connectors for Gemini appear to live under "Gemini Spark" (a web-only surface) and "Gemini Enterprise" (paid business product), not the plain consumer mobile app. Parked until there's clearer evidence. |

**Build order: Claude first.** ChatGPT Action as a fast-follow (reusing the same authenticated
HTTP endpoints, just described via an OpenAPI schema instead of MCP). Gemini not planned for now.

## Architecture overview

```
Claude app (phone/desktop/web)
  -> user talks: "gasté 200 pesos en tacos"
  -> Claude extracts {amount, description, category guess, ...}
  -> Claude calls Gastify's remote MCP server over HTTPS,
     sending the user's personal access token as a static Bearer header
  -> Gastify's MCP route resolves the token -> real Gastify user/wallet
  -> Gastify calls the same transaction-creation logic the app's own UI uses
  -> transaction is saved, a confirmation is returned to Claude, which reads it back to the user
```

No new infrastructure to stand up - this lives on the same Next.js App Router / Vercel deployment
Gastify already runs on.

## Security: personal access tokens (not full OAuth)

Both Claude connectors and ChatGPT Actions support a much simpler auth mode than full OAuth2:
a static `Authorization: Bearer <token>` header configured once when the connector is added.
Since this is a personal, single-user connector (not a public multi-tenant integration), full
OAuth (authorization endpoint, consent screen, refresh tokens) is unnecessary complexity. A
long-lived personal access token is the right scope for this.

- **New field on `User`** (`src/model/User.js`): `apiTokens: [{ name, tokenHash, createdAt,
  lastUsedAt }]` - supports multiple named, independently-revocable tokens (e.g. "Claude
  connector", "ChatGPT connector").
- **Hashing: SHA-256 (Node's built-in `crypto`), not bcrypt.** The codebase's existing hashing
  (`bcryptjs`, used for login passwords) is deliberately slow/salted for low-entropy user-chosen
  secrets, which also makes it unsuitable for lookup - you cannot query "find the user whose
  bcrypt hash matches this" without comparing against every stored hash one by one. A random
  256-bit token is high-entropy already; SHA-256 lets us index `apiTokens.tokenHash` and look it
  up directly with a normal query. This is a deliberate deviation from the existing bcrypt
  pattern, called out explicitly since it differs from precedent elsewhere in the app.
- **Token shown once.** Generated as `crypto.randomBytes(32).toString("hex")`, shown to the user
  exactly once at creation time (standard "copy this now" UX), only the hash persisted.
- **New auth helper** (`src/lib/auth/apiToken.js` or similar): `getUserFromApiToken(request)` -
  reads the `Authorization: Bearer` header, hashes it, looks up the owning `User` + their
  `Wallet`, updates `lastUsedAt`, and throws a 401 if not found. Every MCP tool call and every
  future Action call goes through this instead of trusting a body-supplied `mail`/`user` field
  the way the rest of the app's routes currently do (those are only ever called by Gastify's own
  authenticated frontend, so that trust boundary doesn't apply here - a third-party agent is an
  external caller and must be verified per-request).
- **Settings UI**: a small new section (Profile or a new "Connectors" page) to generate a named
  token (shown once) and list/revoke existing ones (name, created date, last used date).

## Reusable transaction-creation logic

`new-transaction/route.js` currently expects real ObjectIds for `category`/`subCategory`/
`account` (no free-text resolution) and calls `buildTransactionMoney` for currency correctness.
The MCP tool needs the exact same correctness (no bypassing multi-currency handling), so:

- Extract the core "create a transaction" logic (money-building, budget/tag resolution, save)
  out of `new-transaction/route.js` into a shared function, e.g.
  `src/lib/transactions/createTransaction.js`, taking already-resolved IDs. Both the existing
  HTTP route and the new MCP tool call this same function - no duplicated logic, no drift.
- **Category/account resolution is the agent's job, not free-text guessing on our side.** The
  MCP server exposes `list_categories` and `list_accounts` tools; a well-behaved agent calls
  these first, sees the real names/ids that exist in the user's Gastify, and calls
  `create_transaction` with an actual `categoryId`/`subCategoryId`/`accountId` it just looked up.
  This avoids the fragile "does 'comida' match 'Food'" free-text matching problem entirely -
  the existing `speech-add` route's silent case-insensitive-regex-or-null approach is exactly
  what we're moving away from.
- `account` stays optional (mirrors `new-transaction`'s existing tolerance for `account: null`,
  i.e. a wallet-level transaction with no specific account). If no account is given, `currency`
  must be provided explicitly by the tool call and defaults to the wallet's `primaryCurrency`
  otherwise.
- `date` is optional; the tool description explicitly tells the agent: "omit this field if the
  user didn't say when it happened - the server will use the current time." Server defaults to
  `new Date()`, matching `new-transaction`'s existing behavior exactly - this is the "infer 'now'
  when ambiguous" behavior Luis originally asked for, and it falls out of the architecture for
  free rather than needing bespoke NLU.

## MCP server implementation (done)

- Dependencies: `@modelcontextprotocol/sdk@^1.30.0`, `zod@^3.25.76`. **zod v3, not v4** - v4's
  export map isn't resolvable by Next.js 14.2's webpack (`ENOENT .../zod/lib/index.mjs` on
  build); the SDK's zod-compat layer supports both, so pinning to v3 was the correct fix rather
  than waiting on a Next.js upgrade.
- Route: `src/app/api/mcp/route.js`, using `WebStandardStreamableHTTPServerTransport` (the
  Web-standard-Request/Response variant of the SDK's Streamable HTTP transport - a direct fit for
  Next.js App Router handlers, no Node `http.IncomingMessage` adapter needed).
- **Stateless per-request design**: every POST/GET/DELETE builds a fresh `McpServer` + transport
  pair (`sessionIdGenerator: undefined`). Verified empirically that a standalone `tools/call`
  request works with no prior `initialize` on that same instance - stateless mode performs no
  session validation, so this is safe and matches how a horizontally-scaled serverless deployment
  (Vercel) actually behaves. The resolved `{user, wallet}` from `getUserFromApiToken` is closed
  over directly by the tool handlers instead of threaded through the SDK's OAuth-oriented
  `AuthInfo` plumbing, since auth here is a simple pre-check, not a full OAuth flow.
- Every request is authenticated via `getUserFromApiToken` before any tool executes; a missing/
  invalid/revoked token gets a plain 401 JSON response before the MCP server is even built.
- **Tools exposed (v1) - all verified against real data:**
  1. `list_categories` - categories + subcategories (including Gastify's shared defaults),
     scoped to the caller's user/wallet.
  2. `list_accounts` - `{id, name, currency}[]`, scoped to the caller's user/wallet.
  3. `list_projects` - `{id, name}[]` of `budgetType: "project"` Budgets only (added beyond the
     original two-tool plan so the agent can resolve a project the same principled way it
     resolves categories/accounts, per Luis's "vincular a todo" decision - never free-text
     guessing an id).
  4. `create_transaction` - `{ amount, name?, isIncome?, accountId?, categoryId?,
     subCategoryId?, projectId?, tags?, date? }` -> calls the shared creation function, returns a
     short confirmation summary for the agent to read back to the user. `projectId` must
     reference a `budgetType: "project"` Budget (enforced by the shared function already).

### Consolidated into `get_context` (post-Phase-4 feedback, 2026-08-28)

After live-testing the real connector, Luis flagged that `list_categories` + `list_accounts` +
`list_projects` as three separate tool calls before every `create_transaction` was wasteful -
more round-trips, more tokens, and (client-side) more individual tool-approval prompts. Fixed by
merging all three into one **`get_context`** tool that returns accounts, categories/
subcategories, and budgets **of every type** (`project`, `saving`, `spending` - not just
projects, so the agent has full visibility for future read/analytics use cases even though only
`project` budgets are linkable via `create_transaction` today) in a single call. `list_categories`
/`list_accounts`/`list_projects` were removed rather than kept alongside `get_context`, since
keeping both would just grow the tool list without solving the round-trip problem.

Separately, Luis asked about the per-tool-call approval prompt he saw in Claude's UI - that is
Claude's own client-side connector permission setting (e.g. an "always allow" option), not
something Gastify's server controls or this plan can change from our side.

## Phase 5: ChatGPT connector (2026-08-28)

ChatGPT (Plus and above) added native remote MCP support in September 2025, via
**Settings → Apps → Advanced settings → Developer mode → Add custom connector** - so unlike the
original plan assumed, this does **not** need a separate OpenAPI/GPT-Actions integration. It can
reuse the exact same tools as Claude's connector.

The complication: ChatGPT's Developer Mode is OAuth-first and has no confirmed equivalent to
Claude's "no auth + custom header" option, so the header-based `Authorization: Bearer <token>`
scheme Claude uses can't be reused as-is. Building a full OAuth 2.1 authorization server (with
Dynamic Client Registration) was considered and explicitly deferred - real infra, not
proportional to a personal single-user connector - in favor of embedding the token in the URL
itself:

- **New route**: `src/app/api/mcp/[token]/route.js` - reads the token from the URL path segment
  instead of a header, then shares everything else with Claude's route.
- **Refactored to share code, not duplicate it**: `resolveApiToken(token)` in
  `src/lib/auth/apiTokens.js` is now the single hash-and-lookup implementation; both routes just
  differ in how they extract the raw token (header vs. URL segment). The MCP tools themselves
  (`get_context`, `create_transaction`) moved to `src/lib/mcp/buildGastifyMcpServer.js`, imported
  by both `/api/mcp/route.js` and `/api/mcp/[token]/route.js` - one definition, both connectors.
- **Verified**: URL-token route lists tools and calls `get_context` correctly; an invalid token
  401s correctly; the original header-based Claude route is unaffected by the refactor.
- **Security trade-off, explicitly accepted by Luis for now**: a token embedded in a URL is more
  leak-prone than a header (browser history, proxy/server access logs) - acceptable for a
  personal connector, revocable the same way as any other token from Profile if it ever leaks.
  Full OAuth-as-provider was scoped as a separate future upgrade, not a blocker (see below).

### OAuth-as-provider and passkeys - explicitly separate future initiatives, not bundled together

Discussed with Luis and deliberately **not conflated**:
- **OAuth (Gastify as an authorization server for third parties)** would let connectors get
  scoped, revocable, expiring tokens via a real consent screen, instead of today's all-or-nothing
  personal token. Real infra investment (authorization + token endpoints, client registration,
  consent UI) - future work, not needed for the current connectors.
- **Passkeys/WebAuthn for Gastify's own login** (replacing the password Gastify's users log in
  with) is a *different, independent* initiative - about proving who the human is, not about
  delegating access to a third party. NextAuth supports WebAuthn if this gets prioritized later.
  Building one does not give you the other for free.

## Future phases (Luis's long-term vision, 2026-08-28 - not yet scheduled or scoped)

Luis wants to eventually turn this into a full conversational interface to Gastify, phased in
incrementally rather than built all at once:

- **Query/analytics tools**: "how much have I spent this month", "what are my top 6 expense
  categories" - read-only aggregation tools over existing transactions.
- **Edit/delete transactions** via the connector.
- **Manage accounts/categories/projects** (create/edit/delete) via the connector, not just read.
- **Reports, charts, and analytics** - deeper integration than simple text summaries.

None of these are designed yet. Each should get its own scoping pass (tool inputs/outputs,
confirmation-before-destructive-action policy, etc.) before implementation - this list is a
backlog, not a commitment to build in this order.

## Phases

1. **Personal access tokens** - model field, generate/revoke API routes, Settings UI. No MCP yet;
   independently useful/testable (curl with `Authorization: Bearer` against a throwaway
   protected test route).
2. **Extract shared transaction-creation function** from `new-transaction/route.js`; re-point the
   existing route at it with zero behavior change (regression-tested against the existing test
   suite before moving on).
3. **MCP server route + the three tools**, built on top of Phases 1-2.
4. **Manual end-to-end verification** with a real Claude custom connector: add the connector in
   claude.ai (paste the remote MCP URL + personal token), then from the Claude mobile app, speak
   a transaction and confirm it lands correctly in Gastify (including currency correctness for a
   non-primary-currency account, given this session's multicurrency work).
5. **(Later, not in this pass)** ChatGPT Action reusing the same authenticated endpoints via an
   OpenAPI schema, once the Android Actions bug is confirmed resolved or usage is iOS-only.

## Decisions (confirmed by Luis, 2026-08-28)

- **`create_transaction` should support linking to everything available in the app from v1** -
  account, category/subCategory, currency, project (`budget`), and tags. The whole point of the
  feature is that a single voice utterance can create a fully-detailed transaction instantly,
  with manual editing afterward being the exception rather than the norm. Note the existing
  `budget` link already only accepts `budgetType: "project"` (saving/spending budgets aggregate
  from linked Accounts instead, per `useLinkedAccountsTotal` - see
  `MULTI_CURRENCY_IMPLEMENTATION_PLAN.md`), which already matches "proyecto" as Luis described it;
  no change needed to that restriction.
- **One token per agent.** Claude gets its own named token, ChatGPT another, Gemini another if it
  ever becomes viable - never one shared token across agents. Matches what Phase 1 already built
  (named, independently-revocable tokens).
