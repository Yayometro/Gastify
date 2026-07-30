# Master Plan: Projections + Budgets Management

> Consolidated by Claude Sonnet 5, 2026-07-30, replacing the old, unhelpfully-named local plan file (`~/.claude/plans/snazzy-moseying-toast.md`, now stale/deprecated — do not use it). This file is the maintained reference for both features. Read this whole file before touching either area. See `.mds/AI_COORDINATION_LOG.md` Entries #11 and #12 for the chronological build log; this file is the current-state snapshot instead.

## What exists today

Two new dashboard sections, built from scratch (neither existed before this work):

1. **`/dashboard/projections`** — a 12-month income/expense forecast table for a selected year, blending Budget/Income-Source estimates with real transactions for the current month.
2. **`/dashboard/budgets`** — full CRUD for `Budget` documents (create/edit/delete), which never had any UI before (budgets were only ever created by hand in the database).

Both integrate with each other and with the rest of the app automatically because they read/write the same Redux stores and Mongoose models the rest of Gastify already uses — there is no separate data silo.

## Data model changes (all additive, backward compatible)

- **`Budget`** (`src/model/Budget.js`): added `archived: Boolean` (soft-delete) and `history: [{goalAmount, savingAmount, effectiveFrom, effectiveTo}]` (append-only versioning, `effectiveTo: null` = currently active entry). `budget/update` versions this automatically when `goalAmount`/`savingAmount` change; `budget/remove` now soft-deletes (sets `archived: true`, closes the open history entry) instead of hard-deleting; `budget/get` (used by the live dashboard) filters `archived: {$ne: true}`.
- **`Account`** (`src/model/Account.js`): added `accountType: enum["debit","credit","cash","savings"], default "debit"`. Used to exclude credit accounts from "money you actually have" sums.
- **`IncomeSource`** (`src/model/IncomeSource.js`, new model): recurring income streams (salary, freelance, etc.) — `{name, amount, recurrence: enum["monthly","semimonthly","biweekly","weekly"], anchorDate, active, archived, history[]}`. Same versioning/soft-delete pattern as `Budget`.
- **`ProjectionSettings`** (`src/model/ProjectionSettings.js`, new model): one document per `{wallet, year}` — `{unexpectedBuffer, unexpectedIncomeBuffer, monthlyBalances: [{month, balance}]}`.

**Known gotcha, hit twice already**: this dev environment reuses one long-lived `npm run dev` process. Mongoose caches compiled schemas in `mongoose.models` for the lifetime of that process. Any time a field is added to an *existing* model (`Budget`, `Account`, `ProjectionSettings`) without a server restart, saves silently drop the new field — no error, just missing data. New models (`IncomeSource` the first time it was added) aren't affected since they compile fresh on first import. **If a newly-added field doesn't seem to persist, restart the dev server before assuming it's a code bug** — verify directly against MongoDB, not just the UI, since a stale-schema drop is silent.

## Budget CRUD route fixes (found while building Budgets, since nothing had exercised these paths before)

`src/app/api/general-data/budget/{new,update,remove,get}/route.js`:
- `new`/`update` now `.populate([{path:"category"},{path:"subCategory"}])` before returning — they didn't before, so a component reading the response right after create/update (not from a fresh `get`) saw raw ObjectIds instead of `{name, icon, color}`.
- `update`'s `isSaving`/`category`/`subCategory` fields used falsy-checks (`!x ? old : x`), which silently ignored `isSaving: false` and `category/subCategory: null` (both valid "clear this" values, both falsy). Fixed to check `=== undefined` instead.

## Projections — how it works

### Route/components
`src/app/dashboard/projections/page.jsx` → `src/components/multiUsedComp/Projections/{ProjectionsClient,ProjectionsView,ProjectionMonthDetailModal,ProjectionsInfoModal,IncomeSourcesPanel}.jsx`.

### The 12-month table (`buildYearProjectionTable` in `src/helpers/transformers/projectionsChange.js`)
- **Past months**: pure real totals from actual transactions. The detail modal's chart still shows a "budgeted back then" comparison, resolved via `getValueActiveInMonth` (`budgetHistory.js`) against each Budget's/IncomeSource's `history[]` — i.e., it uses whatever the goal *was* at that time, not today's value.
- **Future months**: pure estimate = `Σ non-saving, non-archived Budget.goalAmount + unexpectedBuffer` (expense) and `Σ active IncomeSource.amount × expected-occurrences-that-month + unexpectedIncomeBuffer` (income).
- **Current month**: `MAX(estimate, real-so-far)`, computed **per Budget bucket**, not on the aggregate total — each Budget's shadow (goal) vs actual (real spend matched to it) is maxed individually, then summed, plus an "unexpected" bucket for bills matching no Budget vs `unexpectedBuffer`. This is why the current month's total can be higher than what's actually been spent: any bucket that hasn't yet reached its budget still shows the budgeted ceiling, since the month isn't over. This is intentional, not a bug — see `ProjectionsInfoModal.jsx` for the user-facing explanation.
- Matching a transaction to a Budget always prefers `subCategory` over `category` (never both) — `matchBillToBudget`, exported from `projectionsChange.js` and reused by the Budgets page too.

### Income occurrence counting (`getExpectedOccurrencesInMonth`)
- `monthly` → always 1/month. `semimonthly` (fixed paydays) → always 2/month.
- `biweekly`/`weekly` → computed by walking a periodic sequence forward **and backward** from `anchorDate` (the backward-walk clamp was a real bug, fixed — see Entry #12). `anchorDate` is just "some known payday on the right cycle", not literally the first-ever payment; the app correctly projects both directions from it. `biweekly` (every 14 days) can land 3 occurrences in some months due to calendar drift — intentional, matches real payroll behavior.

### Balance column
- `runningBalance` starts at **today's real total** of non-credit `Account.amount` (the "Total money today" line above the table), then adds each subsequent month's Net forward. Past months show a dash **unless** the user has manually recorded one (see below) — `Account.amount` is never auto-reconciled from transactions, so the app cannot compute what a past balance actually was.
- **Manual per-month balance**: click any past ("Closed") month → "Set actual balance for this month" input, saved into `ProjectionSettings.monthlyBalances`. Purely a historical record — does **not** feed into or re-anchor the forward-projected running balance for later months.

### Buffers
Two independent manual cushions, editable from any month's detail modal: `unexpectedBuffer` (expense side) and `unexpectedIncomeBuffer` (income side), both per-`{wallet,year}` via `ProjectionSettings`.

## Budgets management — how it works

### Route/components
`src/app/dashboard/budgets/page.jsx` → `src/components/multiUsedComp/Budgets/{BudgetsClient,BudgetBarRow,BudgetEditModal}.jsx`. The exact same `BudgetBarRow`/`BudgetEditModal` pair is also reused directly inside the main dashboard's `BudgetCont.jsx` widget ("Wallet Budgets") — there is only one bar-row implementation and one edit modal for the whole app now.

### List view (`BudgetBarRow.jsx`)
- Spending and saving budgets are shown separately (spending budgets read real spend via `matchBillToBudget` against the selected time range's bills; saving budgets show `savingAmount`/`goalAmount` directly, no transaction matching).
- Bar fill is a light→solid **gradient** of whichever color zone the ratio falls in (`getBudgetBarGradient`, `budgetHistory.js`), not a flat color.
- **Color scale** (`getBudgetBarColor`):
  - Spending: green (<60%) → yellow (60–85%) → orange (85–100%) → red (>100%, exceeded).
  - Saving: red (<35%, far from goal) → green (35–85%, getting close) → blue (≥85%, at/very close to or past goal) — deliberately **not** a mirror of the spending scale; chosen per explicit user spec.
- **No gray "fixed" segment** — an earlier iteration split an exceeded bar into a gray/blue "fixed" segment plus a red "overage" segment; this was explicitly rejected by the user ("no te lo pedí"). The current, correct behavior: the bar is *always* a single light→solid gradient of whatever zone color `getBudgetBarColor` resolves to (including red, for exceeded) — exceeded is just another zone on the same gradient technique as green/yellow/orange, not a special two-tone case.
- **Header row layout** (`justify-between`): icon + name/category on the left; on the far right, the balance text ("Exceeded by $X" in red / "$X remaining" in green, or "$X to go" / "Goal reached 🎉" in blue for savings) immediately to the *left* of a large mood emoji (`text-4xl`), balance text itself smaller (`text-sm`) so the emoji reads first at a glance. Computed as `goalAmount − actual`. This went through several rounds of live sizing feedback — if touching this again, keep the emoji visually dominant and the money text secondary, per explicit user preference.
- **Mood emoji** (`getBudgetMoodEmoji`, `budgetHistory.js`): a quick-read indicator matching the same ratio used for the bar color. Spending: 🤩 (<30%, barely spent) → 🙂 (30–60%) → 😐 (60–85%) → 😰 (85–100%, at the limit) → 🔥 (>100%, exceeded). Saving is inverted to match its own 3-tier color scale: 😟 (<35%, far from goal) → 🙂 (35–85%) → 🤩 (≥85%, at/past goal).
- Totals row above the spending list only (`BudgetsClient.jsx`): "Total fixed (budgeted)" = `Σ goalAmount`, "Total real (spent)" = `Σ actual`, for the currently selected time range. Savings are intentionally excluded from this totals row.

### Time filters — must match the Dashboard exactly
Both `BudgetsClient.jsx` and `BudgetCont.jsx` use the **same two components the main `/dashboard` page uses**, wired identically (both write into one shared `startDate`/`endDate` pair, default = current calendar month):
- `SelecterFilter` (`src/components/Filters/selecterFilter/SelecterFilter.jsx`) — preset dropdown. Periods come from `generate_timeperiod_ranges_array_for_dashboard(year)` in `src/helpers/timeFunctions/timeFunctions.js`: This Month, Last Month, First/Second half of month, Last 3 months, Q1–Q4, First/Second half of year, All-{year}, All-{year-1}. Each option's `value` is a `"start*end"` string; `getValueFromSelecter(v)` splits on `*` and sets both dates.
- `TimeRange` (`src/components/Filters/timeRange/TimeRange.jsx`) — the manual Start/End date pickers plus prev/next-month arrow buttons that auto-detect month boundaries (with a hover tooltip naming the target month and its date range).
- **Do not reintroduce a plain day-count dropdown or the bare `RangePicker` component for these two pages** — that was tried once and explicitly rejected as inconsistent with the rest of the app.

### Dashboard integration (`BudgetCont.jsx`)
The old `GoalGaugeRange`/`GoalSavingsRange` Ant Design semi-circular gauges are no longer used here (files still exist, just unreferenced — confirmed via grep that nothing else imports them, so they're safe to delete in a future cleanup pass if desired). Replaced with `BudgetBarRow`, and clicking a row now opens `BudgetEditModal` right from the dashboard — the gauges were read-only, this is new functionality, not just a visual swap.

**Width history — read this before touching `BudgetCont`'s container again.** The widget was originally cramped inside its parent (`wallet-right-col-container`, a `lg:flex lg:flex-col ... items-center` column it shares with `Movements`). First attempt used a CSS "viewport breakout" hack (`w-screen` + `relative left-1/2 -translate-x-1/2`) to escape the narrow parent — **this was wrong and caused a real ~40px horizontal page overflow**, because that centering math assumes the parent is horizontally centered in the true viewport, which isn't true here since the fixed sidebar `Navbar` offsets the whole content area. Confirmed via `getBoundingClientRect()` in the browser: the element extended past `window.innerWidth`.

The **actual root cause** of the narrowness was much simpler: `items-center` on a `flex-col` parent makes children shrink-to-fit (size to content) instead of stretching, unless the child itself declares a width — and the `<div className="budget">` wrapper around `<BudgetCont/>` in `Dashboard.jsx` had no width class at all. **Fix**: added `w-full` to that wrapper div in `Dashboard.jsx` (the actual parent, not `BudgetCont` itself), and simplified `BudgetCont`'s own root div back to a plain `w-full max-w-[1200px] mx-auto` (no breakout trickery needed once the parent stretches correctly). Verified zero overflow afterward (`document.documentElement.scrollWidth === window.innerWidth`).

Also increased the internal vertical scroll containers (`.ind-budget-cont-slide`, both the Budgets and Savings tabs) from `max-h-[400px]` to `max-h-[700px]` so more rows are visible on the dashboard before the user has to scroll within the widget — the scroll behavior itself is intentional and stays, just taller.

## Modal pattern — always use `BasicModal`

`src/components/modals/basicModal/BasicModal.jsx` is the app's real modal shell: clicking the blurred backdrop closes it (via the `close` prop, which doubles as both the "is open" gate and the click handler — pass a stable close-function). `ProjectionMonthDetailModal`, `ProjectionsInfoModal`, and `BudgetEditModal` all render through it via the `renderContent` prop. **Any new modal in this app should use `BasicModal`, not a hand-rolled fixed-position div** — that was a real correction requested by the user after the first pass used a custom wrapper that could only be closed via its X button.

## Input styling — always use the shared classes

Plain `<input>`/`<select>` elements only get the app's real pill-shaped, rounded-border look if their containing `<form>` (or ancestor) has the `form-trans-edit` class and selects additionally have `etm-selector` — both are defined in `src/components/multiUsedComp/css/muliUsed.css`. MUI date/time pickers need an explicit `sx` override (`borderRadius`) since they don't inherit the CSS-class-based rounding automatically — see `IncomeSourcesPanel.jsx`'s `MobileDateTimePicker` for the exact `sx` shape to copy (mirrors `AddTransactionComp.jsx`'s date field).

## Currency formatting

Always use `usdFormatChanger` (`src/helpers/transformers/transactionsChange.js`, wraps `currency-formatter`) for any money value shown in the UI — never raw `.toFixed(2)`. A raw-number display bug (a $52,000 income source read as "52") was the original motivation for this rule.

## Verification approach used throughout

All of the above was verified live against the user's own logged-in Chrome session (via the `claude-in-chrome` MCP tools), including direct MongoDB queries (a small throwaway Node script using the project's own `MONGODB_URI`) whenever a save needed to be confirmed at the data layer, not just visually. Test data created during verification was always cleaned up afterward (soft-deleted/hard-deleted or reset) so the user's real financial data stays intact.

## Vercel deploy gotcha: ESLint errors fail the production build, but not `next dev`

A real production incident: after merging the round-2/round-3 fixes to `main`, the Vercel deployment failed (`state: "ERROR"`). `next dev` never surfaces this because Next.js only runs ESLint as a **build-failing** step during `next build` (production), not in the dev server. Diagnosed via the Vercel MCP tools (`get_deployment_build_logs` with `errorsOnly: true` — `get_runtime_errors` came back empty because the deploy never went live, so always check build logs/deployment `state` first, not just runtime errors, when "it doesn't work on Vercel" but works locally).

The actual failure: `react/no-unescaped-entities` errors in `ProjectionsInfoModal.jsx` — raw apostrophes/quotes inside JSX text content (e.g. `It's the "result"...`) must be escaped (`&apos;`, `&quot;`) or the build fails outright. This rule only fires on literal JSX text children, not on string literals inside `{}` expressions or attributes (e.g. `title="doesn't..."` in a prop is fine) — grepped the rest of the session's new components for the same pattern and confirmed none of them had it, only `ProjectionsInfoModal.jsx`. Fixed and verified with `npx next lint --file <path>` (uses the project's real ESLint config, unlike a standalone `eslint` invocation) before pushing again.

**Rule of thumb**: any new component with hand-written explanatory copy (info modals, tooltips, empty states) needs its JSX text checked for raw `'`/`"` before it's considered done — a working `npm run dev` session proves nothing here.

## Budget time period (monthly/yearly/etc.) — designed, NOT implemented yet

The user wants to declare what time period a Budget's `goalAmount` actually represents — e.g. a "Home" budget (rent + house bills) is naturally monthly, but a "Travel" budget might be a single annual amount ($X/year for the whole year's trips). Today every Budget is implicitly assumed to be a recurring **monthly** target with no way to say otherwise, and the actual-vs-goal comparison on both `/dashboard/budgets` and the dashboard widget just compares real spend within *whatever time range the shared filter happens to be set to* against the full `goalAmount` — which silently produces wrong-feeling numbers for anything that isn't actually monthly (e.g. viewing "This Month" against a $50,000/year Travel budget will almost always look artificially safe/green).

Not implemented this round — deferred for the same reason as multi-category (real schema/logic change, user chose to defer rather than extend an already-long round). Design for next time:

- **Model**: add `period: { type: String, enum: ["monthly", "yearly"], default: "monthly" }` to `Budget`. Keep it simple (two values) unless the user asks for more granularity (weekly/quarterly) later.
- **The real design question is how `period` interacts with the page's shared time filter** (`SelecterFilter`/`TimeRange`, see above) — this needs a decision, not just code:
  - Option A (recommended starting point): **ignore the shared filter for the ratio calculation** and always compute `actual` against the budget's own natural current period — monthly budgets always compare against the current calendar month, yearly budgets against the current calendar year — regardless of what the page's `SelecterFilter`/`TimeRange` is set to. The shared filter would then only affect which historical period's numbers you're *looking at* (e.g. selecting "Last Month" would show a monthly budget's actual spend for last month, or a yearly budget's spend for the year containing "last month"), via the same "does the selected range fall within this budget's period" logic.
  - Option B: prorate — show `goalAmount / 12` as the effective monthly figure for a yearly budget when a monthly-ish filter is active, and the full amount for year-ish filters. More "clever" but harder to explain to the user in the UI, and prorating a real annual budget (e.g. a lump summer trip) is often misleading anyway (spend isn't actually smooth across the year).
  - Recommend Option A and building `getBudgetPeriodRange(budget, referenceDate)` (mirrors `getYearMonthDateRange`'s shape) as the new source of truth for a budget's actual-vs-goal window, replacing the shared-filter-driven range currently used in `BudgetsClient.jsx`/`BudgetCont.jsx` for the ratio/actual computation specifically (the shared filter can stay for whatever it's also used for elsewhere on those pages).
- **UI**: a `period` select (Monthly/Yearly) in `BudgetEditModal.jsx`, next to the goal amount field.
- **Display**: `BudgetBarRow.jsx` should probably show the period somewhere (e.g. "of $50,000/year" instead of just "of $50,000") so it's clear at a glance which budgets are being measured over a longer window.

## Multi-category budgets — designed, NOT implemented yet

The user asked for a Budget to be composed of *several* categories (e.g. one "Kids" budget spanning both the "School" and "Clothes" categories), not just one category/subCategory. This was deliberately **not implemented in the same round as everything else in this file** — it's a real schema/UI change with meaningfully more risk than the polish items above, and was requested right as the user flagged they were close to running out of session tokens. Documenting the design here so a future session can implement it directly instead of re-deriving it:

- **Model**: add `categories: [{category: ObjectId, subCategory: ObjectId}]` to `Budget`, *alongside* the existing singular `category`/`subCategory` fields — do not remove or migrate those, so every existing Budget keeps working unchanged. A Budget either uses the old singular fields (legacy/simple case) or the new `categories[]` array (multi-category case).
- **Matching logic**: `matchBillToBudget` (`projectionsChange.js`) should check `budget.categories?.length > 0` first — if present, the bill matches if it matches *any* entry in that array (same subCategory-takes-precedence-over-category rule per entry as today); otherwise fall back to the existing singular-field check. This is the only function that needs to change for the matching/aggregation side (Projections' `buildYearProjectionTable`, `sumPerBucketMax`, `getMonthBucketBreakdown`, and the Budgets page's `actualByBudgetId` all already funnel through `matchBillToBudget`, so fixing it there fixes all four call sites at once).
- **UI (`BudgetEditModal.jsx`)**: do **not** modify the shared `ModalCategoryContent`/`SelectCategoryContext` picker itself to support multi-select — it's reused by `AddTransactionComp.jsx`, `Movements.jsx` filters, and others as a single-select picker, and changing its selection model risks regressing all of them. Instead, add an "+ Add category" button that opens the *same* single-select picker each time, appending the result to a local list rendered as removable chips (name + small "×"). On submit, send that list as `categories[]`.
- **Display (`BudgetBarRow.jsx`)**: show multiple small category chips/icons in the header instead of one, or a "Category A, Category B +2 more" style summary if the list is long — needs a UX decision, not fully speculated here.
- Ask the user whether existing single-category budgets should be left as-is (recommended — no forced migration) or offered a one-time "convert to multi-category" action.

## Open ideas / not yet done (mentioned in passing, not committed to)

- Deleting the now-unused `GoalGaugeRange.jsx`/`GoalSavingsRange.jsx` files.
- Matching real income transactions to a specific `IncomeSource` (currently the "actual" side of income is always a lump sum of all `isIncome` transactions in range — deliberately not per-source, since there's no reliable transaction→source link today).
- Extending the manual per-month balance concept to also act as a running-balance anchor for later months (currently it's purely informational).
