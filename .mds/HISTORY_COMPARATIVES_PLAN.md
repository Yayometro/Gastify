# History Page Comparatives + Snapshots Plan

**Status:** Phase A done and verified live. Next: Phase B (Categories "vs" comparative).
**Owner:** Luis, implemented by Claude Code

## Motivation

`/dashboard/history` (`HistoryClient.jsx`) shows three sections - income/bills over time, a
categories breakdown, and top-N movements - but every section only ever shows **one** time period
at a time. Luis wants to compare periods directly: this year vs. last year, the last 3 months vs.
the same 3 months last year, or any other pair of ranges - for both the income/bills chart and the
categories breakdown, plus a brand new comparative view for how Budgets performed over time (which
doesn't exist anywhere in the app today).

This is step one of a larger goal: a later **Snapshots** feature (monthly summary, budget
compliance analysis, trend tables, PDF export, eventually readable by the AI connector for deeper
spending-pattern analysis) explicitly depends on solid period-over-period comparison primitives
existing first - hence doing History's comparatives before Snapshots.

## Current architecture (as of 2026-08-28, before this work)

- `HistoryClient.jsx` renders three independent Controller/View pairs, each with its **own**
  local `timePeriod = [start, end]` state - there is no shared time filter across the page, and no
  "compare to another period" capability anywhere in the codebase.
- All aggregation is client-side over `ccTransacciones.data` (every transaction for the wallet,
  fetched once into Redux via `fetchTrans`, unfiltered by date) - each component/section
  re-filters/re-aggregates the same in-memory array by whatever range it cares about.
- Currency-safe summation always goes through `getPrimaryAmount(item)`
  (`src/helpers/transformers/transactionsChange.js`) - every new comparison transformer must too.
- `transactionsToMonths`/`reduceTransToTransMonths` bucket by **calendar month name**
  (january/february/...), which only works correctly within a single year at a time - fine for
  today's single-period views, but wrong for a "vs" comparison whose two ranges span different
  years or don't share calendar months (e.g. "last 3 months" vs "the 3 months before that").
- Controller/View split, Redux Toolkit slices for fetched data, local `useState` for UI-only
  state, `SelecterFilter` (preset dropdown) + `TimeRange` (custom start/end pickers) as the
  standard time-filter UI trio - see `TabsTogglerMontlyController/View.jsx` and
  `HistoricalComparativeCategories(Controller/View).jsx`.
- Budgets have real, mostly-reusable comparison primitives already:
  `getBudgetActualSpend`, `matchBillToBudget`, `getBudgetPeriodRange`, `getValueActiveInMonth`,
  and especially `buildYearProjectionTable` (`src/helpers/transformers/projectionsChange.js`),
  which already builds a 12-month actual-vs-budgeted table for Projections. History currently
  fetches zero budget data.
- **Known gap**: `POST /api/general-data/budget/get` excludes `archived: true` budgets entirely.
  This isn't data loss - `Budget.history[]` (the append-only config log) is preserved forever once
  written, archiving just flips a display flag - but a historical comparative built naively on top
  of that route would silently drop an archived budget's past months. Phase C must query archived
  budgets too when their `history[]` overlaps the requested range.

## Phase A: Income/Bills "vs" comparative

- New state on `TabsTogglerMontlyController`: `compareEnabled` (bool) + `comparePeriod`
  (`[start, end]`, independent of the existing `timePeriod`).
- **New transformer** (`transactionsChange.js`): buckets by **position within the range**
  (month 0, 1, 2...) rather than calendar month name, so two ranges of unequal calendar alignment
  (different years, or non-adjacent ranges) still pair up correctly bar-for-bar. The existing
  `transactionsToMonths` stays untouched (still used by the non-comparison tabs and elsewhere) -
  this is additive, not a refactor of shared code with other call sites.
- UI: a "Compare vs another period" toggle + a second `SelecterFilter`/`TimeRange` pair (reusing
  the exact same filter components, just a second instance), with quick presets derived from the
  primary period (e.g. "same range, 1 year earlier" computed automatically, not just manual).
- Chart: extends the existing "Comparative" tab rather than replacing it - when compare is off,
  behavior is pixel-identical to today; when on, adds period A/B as a further grouping dimension
  on the existing `@ant-design/plots` grouped Column chart.

**Phase A implementation notes:** additive, not a rework - the existing "Comparative"/"Bills"/
"Incomes" tabs are pixel-identical when the new "Compare vs another period" checkbox is off. When
on, a 4th "Compare periods" tab appears with a second `SelecterFilter`+`TimeRange` pair (defaults
to the primary range shifted back exactly one year) and a grouped bar chart (income/bill × period
A/period B) using the new `transactionsToRelativeMonths` bucketing. One bug caught in live
testing: the base `ColumnChartAntComparative`'s default label divides by its `totalValue` prop to
show a percentage, but that prop is a JSX summary block here (not a number) - NaN% until
`generatePropForChartColAntPeriodCompare` overrode `label.text` to show the formatted amount
directly instead (also more meaningful than a percentage for a 4-series chart, where "percent of
which total" is ambiguous). Verified live against real transaction data (2026 vs. 2025, 3-month
range): correct per-period totals/balance, correct month-by-month alignment across the year
boundary, correct tooltip.

## Phase B: Categories "vs" comparative

- Reuses Phase A's dual-range filter UI/state as-is.
- Aggregation is simpler than Phase A - `reduceAndTransforToCategories` per range (period totals,
  not month-bucketed), then paired by category name/id across the two periods.
- Needs a decision on categories present in one period but not the other (render as zero in the
  missing period's bar rather than hiding the category).

## Phase C: Budgets comparative (new section)

- History currently has zero access to Budget data - needs `fetchBudget`/`budgetSlice` wiring
  (matching the page's existing Redux pattern) or a switch to `useGetDataFromProvider()` (matching
  Budgets/Projections' newer pattern).
- Query must include archived budgets whose `history[]` overlaps the filtered range (see the gap
  above) - likely a small addition to `budget/get` (an optional flag) or a new dedicated route,
  decided at implementation time.
- Adapts `buildYearProjectionTable`'s per-month loop to run over an arbitrary filtered range
  (not just a fixed calendar year) and to report **per-budget** rows, not an aggregate total.
- New rollup metric (doesn't exist yet): per-budget "typically met vs. typically exceeded" - e.g.
  % of months in range where actual spend ≤ goal - to directly answer "cuáles budgets suelo
  cumplir, cuáles no."
- UI likely reuses `BudgetBarRow`'s color/emoji-by-ratio visual language per month per budget.

## Later: Snapshots (not scoped yet, explicitly after History work lands)

A richer monthly summary than picking a month in Wallet gives you today - same building blocks
(Transactions Resume, Top 6 transactions/categories, Budget performance) plus: which budgets were
exceeded vs. met, a trend table (this month vs. the established yearly trend - in line with it or
an exception), exportable as PDF, and eventually exposed as MCP tool(s) so Claude/ChatGPT can pull
a wallet's spending-pattern data for deeper analysis (trends, peak-spending months, YoY
comparisons) - directly building on Phase C's per-period aggregation work.
