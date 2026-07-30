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
- **Balance line lives in the header, not below the bar**: "Exceeded by $X" (red) / "$X remaining" (green) — or "$X to go" / "Goal reached 🎉" (blue) for savings — is appended inline after the category name in the header row (e.g. "Category: House — $2,026.57 remaining"), not as a separate line under the bar. Computed as `goalAmount − actual`.
- Totals row above the spending list only (`BudgetsClient.jsx`): "Total fixed (budgeted)" = `Σ goalAmount`, "Total real (spent)" = `Σ actual`, for the currently selected time range. Savings are intentionally excluded from this totals row.

### Time filters — must match the Dashboard exactly
Both `BudgetsClient.jsx` and `BudgetCont.jsx` use the **same two components the main `/dashboard` page uses**, wired identically (both write into one shared `startDate`/`endDate` pair, default = current calendar month):
- `SelecterFilter` (`src/components/Filters/selecterFilter/SelecterFilter.jsx`) — preset dropdown. Periods come from `generate_timeperiod_ranges_array_for_dashboard(year)` in `src/helpers/timeFunctions/timeFunctions.js`: This Month, Last Month, First/Second half of month, Last 3 months, Q1–Q4, First/Second half of year, All-{year}, All-{year-1}. Each option's `value` is a `"start*end"` string; `getValueFromSelecter(v)` splits on `*` and sets both dates.
- `TimeRange` (`src/components/Filters/timeRange/TimeRange.jsx`) — the manual Start/End date pickers plus prev/next-month arrow buttons that auto-detect month boundaries (with a hover tooltip naming the target month and its date range).
- **Do not reintroduce a plain day-count dropdown or the bare `RangePicker` component for these two pages** — that was tried once and explicitly rejected as inconsistent with the rest of the app.

### Dashboard integration (`BudgetCont.jsx`)
The old `GoalGaugeRange`/`GoalSavingsRange` Ant Design semi-circular gauges are no longer used here (files still exist, just unreferenced — confirmed via grep that nothing else imports them, so they're safe to delete in a future cleanup pass if desired). Replaced with `BudgetBarRow`, and clicking a row now opens `BudgetEditModal` right from the dashboard — the gauges were read-only, this is new functionality, not just a visual swap.

The widget was visually cramped inside its parent (`wallet-right-col-container`, a `lg:` two-column flex layout it shares with `Movements`) — narrow on real desktop viewports even though the parent's own `lg:max-w-[50%]s` class is a pre-existing typo (trailing `s` breaks the Tailwind arbitrary-value syntax, so it generates no CSS and isn't actually the cause; the real constraint comes from the flex-row sizing between the two `w-full` sibling columns). Rather than restructure that shared layout (risking `Movements` and other widgets, out of scope), `BudgetCont`'s root div does a **breakout**: `w-full lg:w-screen lg:max-w-[1200px] lg:relative lg:left-1/2 lg:-translate-x-1/2` — a standard "escape a constrained parent, recenter under the viewport, cap at a max width" trick, scoped to `lg:` only so mobile is untouched.

## Modal pattern — always use `BasicModal`

`src/components/modals/basicModal/BasicModal.jsx` is the app's real modal shell: clicking the blurred backdrop closes it (via the `close` prop, which doubles as both the "is open" gate and the click handler — pass a stable close-function). `ProjectionMonthDetailModal`, `ProjectionsInfoModal`, and `BudgetEditModal` all render through it via the `renderContent` prop. **Any new modal in this app should use `BasicModal`, not a hand-rolled fixed-position div** — that was a real correction requested by the user after the first pass used a custom wrapper that could only be closed via its X button.

## Input styling — always use the shared classes

Plain `<input>`/`<select>` elements only get the app's real pill-shaped, rounded-border look if their containing `<form>` (or ancestor) has the `form-trans-edit` class and selects additionally have `etm-selector` — both are defined in `src/components/multiUsedComp/css/muliUsed.css`. MUI date/time pickers need an explicit `sx` override (`borderRadius`) since they don't inherit the CSS-class-based rounding automatically — see `IncomeSourcesPanel.jsx`'s `MobileDateTimePicker` for the exact `sx` shape to copy (mirrors `AddTransactionComp.jsx`'s date field).

## Currency formatting

Always use `usdFormatChanger` (`src/helpers/transformers/transactionsChange.js`, wraps `currency-formatter`) for any money value shown in the UI — never raw `.toFixed(2)`. A raw-number display bug (a $52,000 income source read as "52") was the original motivation for this rule.

## Verification approach used throughout

All of the above was verified live against the user's own logged-in Chrome session (via the `claude-in-chrome` MCP tools), including direct MongoDB queries (a small throwaway Node script using the project's own `MONGODB_URI`) whenever a save needed to be confirmed at the data layer, not just visually. Test data created during verification was always cleaned up afterward (soft-deleted/hard-deleted or reset) so the user's real financial data stays intact.

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
