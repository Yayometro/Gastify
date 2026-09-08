# AI Monthly Summary Plan (read-only MCP tools for Wallet Analyzer data)

## Motivation

Gastify already computes a rich set of financial facts for the user every month via
`buildWalletAnalyzerSnapshot()` (`src/helpers/transformers/walletAnalyzer.js`) - month totals,
category/transaction comparisons vs. last month, a 6-month trend, budget streaks, detected
subscriptions, spending pace, biggest-spend patterns, 12-month monthly champions, weekday
spending patterns, savings-rate history, a category anomaly, and even short pre-generated
insight cards. This is exactly the data the Wallet Analyzer UI renders - it's just never been
exposed outside the app.

The existing Gastify MCP server (`src/lib/mcp/buildGastifyMcpServer.js`) is write-only today:
`create_transaction`/`create_transactions` plus a thin `get_context` that only returns
ids/names for resolving those writes. There is no read path for actual financial data.

**Goal**: expose the Wallet Analyzer snapshot as MCP tools so the user's own connected AI
(Claude, ChatGPT, and now Gemini via Spark's custom-app connector - all three already point at
the same MCP server, just via different auth transports) can produce a monthly summary on
request, or via voice.

### What the AI actually adds on top of data Gastify already computes

Decided during planning discussion, worth keeping explicit so nobody "fixes" this later by having
the AI recompute totals: Gastify's own code computes every number correctly and cheaply; an LLM
recomputing them from raw transactions is slower, costs the user tokens, and risks arithmetic
mistakes. The AI's real value-add is on top of the facts, not instead of them:

1. **Narrative synthesis** - turning ~10 disconnected fact-objects into one coherent story.
2. **Judgment on what matters most for *this* user's month** - `generateInsights()` is a fixed,
   capped-at-5 rule list; an LLM can weigh everything together.
3. **Actionable framing** - "Comida over budget" is a fact; a concrete suggestion is advice.
4. **Follow-up interactivity** - the user can ask "why was Uber up?" conversationally after the
   summary; a static dashboard can't do that.
5. **Format/voice flexibility** - same data, rendered however the user's client prefers.

Every tool below returns its data **together with an explicit `instructions` field** telling the
model to do exactly this and nothing else (see "Instructions text" below) - baked into the tool
*result*, not only the tool *description*, so the guidance survives regardless of which of the
three clients is calling it and whether that client's model re-reads the tool description before
using a result it already has.

## Three tools, not two (expanded during planning)

Both `get_monthly_summary`/`get_monthly_summary_detailed` already take an optional
`month`/`year`, so "análisis de enero" already works without a third tool - the model just
passes `{month: 1, year: 2026}` instead of omitting the input. What that pair *can't* do on its
own is a **direct, precise comparison of two arbitrary months** (e.g. "compara enero contra
diciembre") - the model could call the summary tool twice and eyeball the difference itself, but
that's exactly the kind of arithmetic-on-numbers-it-was-told-not-to-invent this plan's
instructions already warn against, and doing it server-side is strictly more accurate.

**Third tool: `compare_months`.** Takes two `{month, year}` pairs (`monthA`, `monthB` - order
doesn't imply "current vs previous," both are just labeled months), returns each month's totals
plus a category/transaction-level diff between them - computed with the exact same primitives
`buildWalletAnalyzerSnapshot` itself uses (`compareCategoriesAcrossMonths`,
`compareTransactionsAcrossMonths`), which already accept two *arbitrary* ranges as parameters,
not ranges assumed to be adjacent. No new comparison math to write - just a new orchestrating
function that calls existing pure functions with two independently-chosen ranges instead of
"this month" and "the month right before it."

```js
// walletAnalyzer.js
export function buildMonthComparison({ transactions, monthADate, monthBDate, topN = 12 }) {
  const rangeA = getMonthRange(monthADate);
  const rangeB = getMonthRange(monthBDate);
  return {
    monthA: { label: monthLabel(monthADate), totals: getMonthTotals(transactions, rangeA.start, rangeA.end) },
    monthB: { label: monthLabel(monthBDate), totals: getMonthTotals(transactions, rangeB.start, rangeB.end) },
    categoriesBills: compareCategoriesAcrossMonths(transactions, true, rangeA, rangeB, topN),
    categoriesIncomes: compareCategoriesAcrossMonths(transactions, false, rangeA, rangeB, topN),
    transactionsBills: compareTransactionsAcrossMonths(transactions, true, rangeA, rangeB, topN),
  };
}
```

`compare_months`' instructions field: *"Both months' data is already computed and correct.
Synthesize the comparison into prose (what changed, by how much, in which direction) - don't
just restate two lists side by side."* Same "reply in the user's language" line as the other two.

The MCP tool handler's own transaction fetch (see below) needs to cover **both** requested
months when this tool is called, not just a 12-month lookback from "now" - if the user asks to
compare January 2024 against December 2025, the query's date range must span from the earlier of
the two months' start to the later of the two months' end, computed from the two actual requested
dates, not from `getSnapshotLookbackStart(today)`.

## Two-tier design (decided)

One curated (cheap, default) tool and one detailed (expensive, on-demand) tool - not one tool
with a "detail level" parameter, so the model's own tool-selection reasoning naturally maps onto
"start cheap, go deeper only if asked."

Real payload-size numbers matter here, so this section only records the actual measured
decision, not a guess: `budgetRows` (each budget's full `monthlySeries`, up to 12 months) is by
far the single heaviest field in the full snapshot - heavier than dropping topN from 12 to 6.
The curated payload therefore does two things, not one: trims topN and drops the 12-month/
history-heavy fields (`monthlyChampions`, `biggestSpendPatterns`, `topCategoriesBillsPrevious`),
**and** strips `monthlySeries` out of every `budgetRows` entry (keeping only
`category/limit/spent/pct/streakMonths/status`). Both cuts matter; the `budgetRows` one matters
more.

**Measured against this account's real data** (not an estimate - called the real tools over the
real MCP route once implemented, via `curl`): curated `get_monthly_summary` payload = **12,458
chars (~3,100 tokens)**; full `get_monthly_summary_detailed` = **35,758 chars (~8,940 tokens)**;
`compare_months` (two non-adjacent months, January vs. August) = **8,372 chars (~2,100 tokens)**.
All three came in smaller than the pre-implementation estimate (curated: ~25-28K est. -> 12.5K
actual) - the estimate didn't account for `budgetRows` also having its per-budget `monthlySeries`
stripped inside `insights[]` (see the bug note below), which turned out to matter more than
guessed. A real bug was only caught by this live measurement, not by the unit tests: a
"budget"-type insight card (`generateInsights`' `bestStreak`/`worstBudget`) embeds a full,
*uncurated* `budgetRows` entry as its own `data` - so `monthlySeries` was leaking right back into
the curated payload through the insight card even after the top-level `budgetRows` array was
correctly trimmed. Fixed in `buildCuratedWalletSummary` by also stripping `monthlySeries` from
any `insights[]` entry with `type === "budget"` - regression-tested in
`walletAnalyzer.test.js` (a fixture that reliably produces a "budget" insight, not just an
empty-array vacuous pass).

| Tool | Payload | When |
|---|---|---|
| `get_monthly_summary` | Curated: current+previous totals, `insights`, trimmed `budgetRows` (no `monthlySeries`), top-6 categories (bills+incomes)/transactions, subscriptions, pace, weekday pattern, savings history, monthly averages, category anomaly | Default - the model calls this first for any "how was my month" / "monthly summary" ask |
| `get_monthly_summary_detailed` | Full `buildWalletAnalyzerSnapshot()` output, unmodified - top-12, full `budgetRows.monthlySeries`, `monthlyChampions` (12mo), `biggestSpendPatterns` (12mo), `topCategoriesBillsPrevious` | Only when the user asks to go deeper into something specific after seeing the summary |
| `compare_months` | Two months' totals + category/transaction-level diff between them (see below) | The user names two specific months to compare directly, not just "this vs. last month" |

The first two tools take the same optional input: `month` (1-12) and `year` - defaulting to the
current calendar month when omitted, so "resumen de agosto" or "cómo estuvo julio 2026" both work
without the model having to compute a reference date itself. Neither is limited to the current or
most-recent month - any past month the user names works the same way.

## Data layer changes

### 1. New pure function: `buildCuratedWalletSummary(snapshot)` in `walletAnalyzer.js`

Takes the object `buildWalletAnalyzerSnapshot()` already returns and produces the trimmed
payload described above. Pure/sync, no new data fetching - lets both the MCP tool and (later, if
ever wanted) a UI surface reuse the exact same curation logic instead of two independently-
maintained trims drifting apart.

```js
export function buildCuratedWalletSummary(snapshot) {
  return {
    currentTotals: snapshot.currentTotals,
    previousTotals: snapshot.previousTotals,
    insights: snapshot.insights,
    budgetRows: snapshot.budgetRows.map(({ monthlySeries, ...rest }) => rest),
    topCategoriesBills: snapshot.topCategoriesBills.slice(0, 6),
    topCategoriesIncomes: snapshot.topCategoriesIncomes.slice(0, 6),
    topTransactionsBills: snapshot.topTransactionsBills.slice(0, 6),
    subscriptions: snapshot.subscriptions,
    pace: snapshot.pace,
    weekdaySpending: snapshot.weekdaySpending,
    savingsHistoryLabeled: snapshot.savingsHistoryLabeled,
    monthlyAverages: snapshot.monthlyAverages,
    categoryAnomaly: snapshot.categoryAnomaly,
  };
}
```

### 2. Scoped transaction fetch for the MCP tools (new, not reusing `get-transactions`' unbounded query)

Every consumer of `buildWalletAnalyzerSnapshot` today (`WalletAnalyzer.jsx`,
`WalletAnalyzerTeaser.jsx`) reads `transactions` from Redux, which `get-transactions` populates by
fetching **the user's entire transaction history**, unbounded - fine for a client-side store
that's fetched once and reused across the whole dashboard, wasteful for a server-side tool call
that only ever needs a bounded lookback.

Every computation inside `buildWalletAnalyzerSnapshot` caps its own lookback at 12 months back
from the reference date (`computeBudgetStreaks`/`findBiggestSpendPatterns`/`computeMonthlyChampions`
all use `lookbackMonths = 12`; everything else uses less). So the MCP tool handler's own Mongo
query should filter `date >= startOfWindow` where `startOfWindow` is the first day of the month
12 months before the reference month - both tools can use this same bounded query (the detailed
tool doesn't need a wider window than the curated one, since neither computation looks back
further than 12 months regardless of which tool calls it).

New tiny helper, e.g. `getSnapshotLookbackStart(referenceDate)` in `walletAnalyzer.js` (or inlined
in the MCP file if it doesn't need testing on its own) - one line, `new Date(ref.getFullYear(),
ref.getMonth() - 11, 1)`.

## MCP tool registration (`buildGastifyMcpServer.js`)

Both new tools follow the same shape as `get_context`/`create_transaction` already do in this
file - `server.registerTool(name, { title, description, inputSchema }, handler)`.

```js
const monthYearInputShape = {
  month: z.number().int().min(1).max(12).optional()
    .describe("1-12. Omit along with year to use the current calendar month."),
  year: z.number().int().optional()
    .describe("e.g. 2026. Omit along with month to use the current calendar month."),
};

function resolveReferenceDate({ month, year }) {
  const today = new Date();
  if (month == null && year == null) return today;
  return new Date(year ?? today.getFullYear(), (month ?? today.getMonth() + 1) - 1, 1);
}
```

- `get_monthly_summary` - `inputSchema: monthYearInputShape`. Handler: resolve reference date,
  Mongo-fetch transactions (populated category/subCategory/account, date-bounded per above) +
  budgets for `{user, wallet}`, call `buildWalletAnalyzerSnapshot`, call
  `buildCuratedWalletSummary`, return `{ content: [{ type: "text", text: JSON.stringify({ data,
  instructions: MONTHLY_SUMMARY_INSTRUCTIONS }) }] }`.
- `get_monthly_summary_detailed` - same input/fetch, skips the curation step, returns the full
  snapshot instead, with its own (shorter) instructions reminding the model this is the *detail*
  layer for a specific follow-up, not a second monthly summary from scratch.

### Instructions text (draft, finalize when implementing)

```
These figures are already computed and correct - never recalculate or invent numbers from them.
Your job is to synthesize them into a short narrative (not a list of cards): one headline number
for the month, 2-3 things that genuinely stand out, budget status, and one or two concrete,
actionable suggestions. Use `insights` as a starting point but weigh the rest of the data too -
you're not limited to only those 5 if something else here matters more for this user. Reply in
the same language the user is writing/speaking in. Close by asking if they want you to go deeper
into anything specific (a category, a budget, the last 12 months) - if they say yes, call
get_monthly_summary_detailed for that.
```

Detailed-tool variant: same opening line about never inventing numbers, then: *"This is the full
12-month-lookback dataset behind the summary you already gave - use it to answer the specific
follow-up the user asked about, not to redo the whole monthly narrative again."*

## Files to create / edit

- **Edit** `src/helpers/transformers/walletAnalyzer.js` - add `buildCuratedWalletSummary`,
  `getSnapshotLookbackStart`, and `buildMonthComparison`, all exported.
- **Edit** `src/helpers/transformers/walletAnalyzer.test.js` - unit tests for all three:
  `buildCuratedWalletSummary` (confirms `monthlySeries` is stripped from every budget row, topN
  slicing to 6, every expected key present/absent), `getSnapshotLookbackStart`, and
  `buildMonthComparison` (confirms it works for two *non-adjacent* months, not just consecutive
  ones - that's the whole point of it over the existing snapshot comparison).
- **Edit** `src/lib/mcp/buildGastifyMcpServer.js` - register all three new tools, following the
  existing `get_context`/`create_transaction` pattern exactly (same file, no new module - this
  file is already the documented single source of truth shared by every connector entry point).
- **No changes needed** to `src/app/api/mcp/route.js` or `src/app/api/mcp/[token]/route.js` -
  both already just call `handleGastifyMcpTransport`, which builds the tool set from
  `buildGastifyMcpServer`; new tools appear automatically on every existing connector (Claude,
  ChatGPT, Gemini) with zero route changes.
- **No new API tokens, no new auth path** - reuses the exact same personal-access-token
  mechanism already working for all three connectors.
- **No database writes, no schema changes** - purely additive, read-only tools.

## Testing / verification plan

- `npx vitest run` - full suite must stay green; new `walletAnalyzer.test.js` cases added for the
  new pure functions.
- `npx eslint` on every changed file.
- **Live verification, all three connectors** (per this repo's standing "verify live, don't just
  read the diff" discipline): ask each of Claude, ChatGPT, and Gemini Spark (all three already
  connected) for a monthly summary, confirm each one calls `get_monthly_summary` (not the
  detailed tool) by default, produces a narrative (not a raw data dump), and correctly escalates
  to `get_monthly_summary_detailed` only when asked to go deeper.
- Spot-check payload size for real: log `JSON.stringify(...).length` for both tool results during
  manual testing (temporarily, removed before commit) to confirm the curated payload lands in the
  ~6-7k-token range this plan is built around, not a regression back toward the full snapshot's
  ~10-11k tokens.

## Explicitly out of scope for this round

- **No in-app "Generate my summary" button** - decided during planning: MCP-only for now, so
  Gastify never needs its own LLM API key/billing and the same tools work uniformly across
  whichever of the user's own AI clients speak MCP.
- **No Gemini Enterprise / OAuth2 work** - Gemini is already connected via Spark's custom-app
  connector (personal Google account, URL-embedded-token, same pattern as ChatGPT) - confirmed
  working. Gemini *Enterprise*'s custom-MCP feature (org-only, requires building a full OAuth2
  authorization server) was investigated and explicitly rejected as unnecessary complexity for a
  personal single-user connector, same reasoning the original connector plan already used to
  reject full OAuth for Claude/ChatGPT.
- **No DeepSeek connector** - no first-party custom-MCP-connector path exists in DeepSeek's own
  chat product today (only third-party wrapper tools that aren't equivalent to what Claude/
  ChatGPT/Gemini already offer natively). Revisit if that changes.
