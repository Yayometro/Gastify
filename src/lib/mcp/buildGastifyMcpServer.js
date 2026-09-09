import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { createTransaction } from "@/lib/transactions/createTransaction";
import { formatMoneyMinor } from "@/lib/money/currencies";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Account from "@/model/Account";
import Budget from "@/model/Budget";
import Transaction from "@/model/Transaction";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";
import { filterBillsOrIncomes, getTransactionsFromTimeRange } from "@/helpers/transformers/transactionsChange";
import { getMonthCurrencyBreakdown } from "@/helpers/transformers/projectionsChange";
import {
  buildWalletAnalyzerSnapshot,
  buildCuratedWalletSummary,
  buildMonthComparison,
  getSnapshotLookbackStart,
  getMonthRange,
  buildPeriodSnapshot,
  buildCuratedPeriodSummary,
  getPeriodSnapshotLookbackStart,
  buildPeriodComparison,
  getPrecedingPeriods,
} from "@/helpers/transformers/walletAnalyzer";
import { getLastDayOfQuarter } from "@/helpers/timeFunctions/timeFunctions";
import { buildProjectionsForRange } from "@/lib/mcp/mcpProjections";

// Shared by both create_transaction and create_transactions so the two
// tools can never drift on what a "transaction" input looks like.
const transactionInputShape = {
  amount: z
    .number()
    .positive()
    .describe(
      "The transaction amount in major currency units (e.g. 200 for $200.00). Always positive - use isIncome to indicate direction."
    ),
  name: z
    .string()
    .optional()
    .describe("A short label, e.g. 'Tacos'. Defaults to a generic name if omitted."),
  isIncome: z
    .boolean()
    .optional()
    .describe("true if this is money coming in. Defaults to false (an expense)."),
  accountId: z
    .string()
    .optional()
    .describe(
      "An account id from get_context. Omit for a wallet-level transaction (uses the wallet's primary currency)."
    ),
  categoryId: z.string().optional().describe("A category id from get_context."),
  subCategoryId: z
    .string()
    .optional()
    .describe(
      "A subcategory id from get_context. If set, its parent category is applied automatically."
    ),
  projectId: z
    .string()
    .optional()
    .describe(
      "A budgetType:'project' budget id from get_context, if the user mentioned linking this to a project. Passing a saving/spending budget id fails - only projects can be linked directly."
    ),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tag names to attach, e.g. ['trip-cancun']. Created automatically if new."),
  date: z
    .string()
    .optional()
    .describe("ISO 8601 date/time. Omit if the user didn't say when it happened - defaults to now."),
};

// Creates one transaction and returns a short human-readable summary line.
// Throws on failure - callers decide whether that should fail the whole
// request (create_transaction) or just that one item (create_transactions).
async function createOneTransaction(
  { user, wallet },
  { amount, name, isIncome, accountId, categoryId, subCategoryId, projectId, tags, date }
) {
  const { transaction, name: resolvedName } = await createTransaction({
    user: user._id,
    wallet: wallet._id,
    name,
    amount,
    isIncome,
    isBill: !isIncome,
    account: accountId,
    category: categoryId,
    subCategory: subCategoryId,
    budget: projectId,
    tags,
    date,
  });
  const native = transaction.displayMoney?.native;
  const formattedAmount = native ? formatMoneyMinor(native.amountMinor, native.currency) : `${amount}`;
  return [
    `Created "${resolvedName}": ${formattedAmount}`,
    transaction.date ? `on ${new Date(transaction.date).toLocaleDateString()}` : null,
    transaction.category?.name ? `in ${transaction.category.name}` : null,
    transaction.budget?.name ? `linked to project "${transaction.budget.name}"` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

// Shared by get_monthly_summary and get_monthly_summary_detailed - both
// take the same "which calendar month" input, defaulting to the current one
// so the model doesn't need to compute a reference date itself for the
// common case, while still supporting "análisis de enero" etc.
const monthYearInputShape = {
  month: z
    .number()
    .int()
    .min(1)
    .max(12)
    .optional()
    .describe("1-12. Omit along with year to use the current calendar month."),
  year: z
    .number()
    .int()
    .optional()
    .describe("e.g. 2026. Omit along with month to use the current calendar month."),
};

function resolveReferenceDate({ month, year }) {
  const today = new Date();
  if (month == null && year == null) return today;
  return new Date(year ?? today.getFullYear(), (month ?? today.getMonth() + 1) - 1, 1);
}

// History's Wallet Analyzer, comparatives, and projections all analyze an
// arbitrary multi-month range - never a single calendar month - so the
// period-level MCP tools need the same range flexibility a human gets from
// History's own period dropdown + custom start/end pickers, not just
// "which month". `preset` mirrors that dropdown's exact named options
// (see usePeriodComparison.js / timeFunctions.js's timeperiodRangesArray)
// plus rolling last-N-months windows the UI dropdown doesn't expose but
// people ask an AI for directly ("cómo van mis últimos 6 meses").
const PERIOD_PRESETS = [
  "last_3_months",
  "last_6_months",
  "last_12_months",
  "this_quarter",
  "last_quarter",
  "this_half",
  "last_half",
  "this_year",
  "last_year",
];

const periodInputShape = {
  preset: z
    .enum(PERIOD_PRESETS)
    .optional()
    .describe(
      "A named period. 'last_3_months'/'last_6_months'/'last_12_months' are rolling windows ending today (not calendar-aligned). 'this_quarter'/'last_quarter'/'this_half'/'last_half'/'this_year'/'last_year' are calendar-aligned (e.g. this_quarter = Jul-Sep if today is in Q3, this_year = Jan-Dec of the current year). Omit both this and from/to to default to last_3_months."
    ),
  from: z.string().optional().describe("ISO date, custom range start (inclusive). Provide together with `to` - ignored if `preset` is set."),
  to: z.string().optional().describe("ISO date, custom range end (inclusive, whole day). Provide together with `from` - ignored if `preset` is set."),
};

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Resolves one {preset|from/to} input into a concrete {start,end} range plus
// a human label for it - shared by every period-level tool below so
// "last_quarter" (etc.) can never resolve differently between
// get_period_summary and compare_periods.
function resolvePeriodRange({ preset, from, to } = {}, today = new Date()) {
  if (from && to) {
    const start = new Date(from);
    const end = endOfDay(new Date(to));
    return { range: { start, end }, label: `${start.toISOString().slice(0, 10)} to ${to}` };
  }
  const year = today.getFullYear();
  const halfRange = (y, half) =>
    half === 1 ? { start: new Date(y, 0, 1), end: new Date(y, 6, 0, 23, 59, 59, 999) } : { start: new Date(y, 6, 1), end: new Date(y, 12, 0, 23, 59, 59, 999) };

  switch (preset) {
    case "last_6_months":
      return { range: { start: new Date(year, today.getMonth() - 5, 1), end: today }, label: "Last 6 months" };
    case "last_12_months":
      return { range: { start: new Date(year, today.getMonth() - 11, 1), end: today }, label: "Last 12 months" };
    case "this_quarter": {
      const qIdx = Math.floor(today.getMonth() / 3);
      return { range: { start: new Date(year, qIdx * 3, 1), end: getLastDayOfQuarter(year, qIdx + 1) }, label: `Q${qIdx + 1} ${year}` };
    }
    case "last_quarter": {
      let qIdx = Math.floor(today.getMonth() / 3) - 1;
      let y = year;
      if (qIdx < 0) {
        qIdx = 3;
        y -= 1;
      }
      return { range: { start: new Date(y, qIdx * 3, 1), end: getLastDayOfQuarter(y, qIdx + 1) }, label: `Q${qIdx + 1} ${y}` };
    }
    case "this_half": {
      const half = today.getMonth() < 6 ? 1 : 2;
      return { range: halfRange(year, half), label: `${half === 1 ? "First" : "Second"} half ${year}` };
    }
    case "last_half": {
      const half = today.getMonth() < 6 ? 2 : 1;
      const y = today.getMonth() < 6 ? year - 1 : year;
      return { range: halfRange(y, half), label: `${half === 1 ? "First" : "Second"} half ${y}` };
    }
    case "this_year":
      return { range: { start: new Date(year, 0, 1), end: new Date(year, 12, 0, 23, 59, 59, 999) }, label: `All ${year}` };
    case "last_year":
      return { range: { start: new Date(year - 1, 0, 1), end: new Date(year - 1, 12, 0, 23, 59, 59, 999) }, label: `All ${year - 1}` };
    case "last_3_months":
    default:
      return { range: { start: new Date(year, today.getMonth() - 2, 1), end: today }, label: "Last 3 months" };
  }
}

// Shared by all three wallet-analysis tools - scoping the Mongo query to a
// date range (rather than the user's entire transaction history, which is
// what the app's own get-transactions route fetches for its Redux store)
// matters here because this runs fresh on every single tool call, not once
// per page load. Every computation inside buildWalletAnalyzerSnapshot caps
// its own lookback at 12 months, so `from`/`to` only need to cover that.
//
// attachDisplayMoneyToList is not optional here: every walletAnalyzer.js
// total goes through getPrimaryAmount, which reads transaction.displayMoney
// .primary and, if it's missing, silently falls back to the raw legacy
// `amount` field summed as-is - blending USD and MXN transactions together
// as if they were the same currency. Every other route in the app attaches
// this DTO before doing any money math (see get-transactions/route.js); the
// MCP tools must do the same or their totals are wrong for any wallet with
// more than one transaction currency.
async function fetchTransactionsAndBudgets({ user, wallet }, { from, to } = {}) {
  const transactionQuery = { user: user._id, wallet: wallet._id };
  if (from || to) {
    transactionQuery.date = {};
    if (from) transactionQuery.date.$gte = from;
    if (to) transactionQuery.date.$lte = to;
  }
  const [rawTransactions, budgets] = await Promise.all([
    Transaction.find(transactionQuery)
      .populate("category")
      .populate("subCategory")
      .populate("account")
      .lean(),
    Budget.find({ user: user._id, wallet: wallet._id, archived: { $ne: true } }).lean(),
  ]);
  const transactions = await attachDisplayMoneyToList(rawTransactions, wallet.primaryCurrency || "MXN");
  return { transactions, budgets };
}

// Wallet Analyzer's totals are already currency-correct once displayMoney is
// attached (getPrimaryAmount converts every transaction into the wallet's
// primary currency before summing) - but a single blended total doesn't
// tell the AI *which* amounts came from a non-primary currency, the way the
// dashboard's own CurrencyBreakdownChips do for a human. Returns null when
// nothing in range is multi-currency, so the common case (everything in the
// wallet's own currency) doesn't pay for an empty field.
function buildCurrencyBreakdown(transactions, walletPrimaryCurrency, range) {
  const monthTx = getTransactionsFromTimeRange(transactions, range.start, range.end);
  const { incomes, bills } = filterBillsOrIncomes(monthTx);
  const income = getMonthCurrencyBreakdown(incomes, walletPrimaryCurrency);
  const expense = getMonthCurrencyBreakdown(bills, walletPrimaryCurrency);
  if (!income.isMultiCurrency && !expense.isMultiCurrency) return null;
  return {
    income: income.isMultiCurrency ? income.breakdown : null,
    expense: expense.isMultiCurrency ? expense.breakdown : null,
  };
}

// Baked into every wallet-analysis tool's *result* (not only its
// description) so the guidance survives regardless of which client is
// calling it and whether that client's model re-reads the tool description
// before using a result it already has. See .mds/AI_MONTHLY_SUMMARY_PLAN.md
// for why the AI's job here is synthesis/prioritization, never recomputing
// numbers Gastify already computed correctly.
const CURRENCY_NOTE =
  " `walletPrimaryCurrency` is the currency every total is already converted into. If `currencyBreakdown` is present for a period, some of that period's income or expense came from a different currency - call out the native amount and its conversion rate explicitly (e.g. 'of that, $X USD converted at Y') instead of only reporting the blended total. If `currencyBreakdown` is absent (null), everything that period was already in the wallet's own currency - don't mention currency at all.";

// Shared by all three tools - this is the actual lever for analysis depth.
// The underlying data already carries multi-month trend context
// (monthlyAverages, savingsHistoryLabeled, categoryAnomaly), per-weekday-name
// spending (weekdaySpending.days, not just a weekday/weekend split), each
// budget's streak/status history, and a deterministic possibleDuplicateInMonth
// flag on subscriptions - none of that is worth much if the model just
// recites the headline totals instead of actually reasoning over it. Written
// as concrete instructions (not "be more detailed") specifically because a
// vague ask produced wildly inconsistent depth across different models
// calling these same tools with the same data.
const ANALYSIS_DEPTH_NOTE =
  " Do not just recite the numbers - this data supports real analysis, use all of it: (1) frame notable figures against their own multi-month trend (monthlyAverages, savingsHistoryLabeled, categoryAnomaly), not only against the single prior period - e.g. 'this is the 4th month in a row this rose' is more useful than '+11% vs last month'; (2) when weekdaySpending shows concentration, name the actual weekday(s) (`days[].dayName`), not a generic 'weekday vs weekend' split; (3) use each budget's `streakMonths`/`status` to say whether an overage is a one-off or a repeat pattern, and whether a big one-off transaction (check topTransactionsBills / topCategoriesBills) is what's distorting an otherwise-normal budget; (4) actively flag anything that looks inconsistent or worth the user confirming - a brand-new category, an unusually large one-off transaction, income that breaks the historical pattern, a subscription with `possibleDuplicateInMonth: true` - and ask about it directly rather than only stating the figure. A short response can still be analytically dense: fewer words, not fewer insights - don't compress by dropping analysis, compress by dropping restated numbers the user can already see in the app.";

const MONTHLY_SUMMARY_INSTRUCTIONS =
  "These figures are already computed and correct - never recalculate or invent numbers from them. Your job is to synthesize them into a short but insight-dense narrative: one headline number for the month, then whatever 3-5 things genuinely matter this month - trend shifts, budget patterns, anomalies worth flagging, a clarifying question - not a fixed template of 'headline + 2 generic bullets'. Use `insights` as a starting point but weigh the rest of the data too - you're not limited to only those 5 if something else here matters more for this user." +
  ANALYSIS_DEPTH_NOTE +
  CURRENCY_NOTE +
  " Reply in the same language the user is writing/speaking in. Close by asking a specific follow-up grounded in something you actually found (not a generic 'want more detail?') - if they want to go deeper, call get_monthly_summary_detailed. If they name two specific months to compare directly, use compare_months instead of calling this tool twice yourself.";

const DETAILED_SUMMARY_INSTRUCTIONS =
  "These figures are already computed and correct - never recalculate or invent numbers from them. This is the full 12-month-lookback dataset behind the summary you already gave - use the full detail available (tables comparing categories/months where useful, the complete top-12 lists, each budget's full history) to go deeper on what the user asked about, not to repeat the short narrative with more decimals." +
  ANALYSIS_DEPTH_NOTE +
  CURRENCY_NOTE +
  " Reply in the same language the user is writing/speaking in.";

const COMPARE_MONTHS_INSTRUCTIONS =
  "Both months' figures are already computed and correct - never recalculate or invent numbers from them. Synthesize the comparison into prose (what changed, by how much, in which direction, and why if the data suggests a reason) - don't just restate two lists side by side." +
  ANALYSIS_DEPTH_NOTE +
  CURRENCY_NOTE +
  " Reply in the same language the user is writing/speaking in.";

// Distinguishes the period-level tools from the monthly ones above: this
// data always spans 3+ months (History's own minimum), so it carries insight
// types that don't exist in the monthly tools - which calendar month/quarter
// inside the period spent the most, and how that compares to the previous
// equivalent period. Appended to every period-level tool's instructions
// alongside the same ANALYSIS_DEPTH_NOTE/CURRENCY_NOTE the monthly tools use.
const PERIOD_ANALYSIS_NOTE =
  " This period-level data also carries insight types the monthly tools don't have, because a period always spans 3+ months: `monthlyChampions.months` is a per-calendar-month breakdown (each month's total spend and its top category) covering exactly the requested range, `quarterTotals` is the same idea bucketed by real calendar quarter (only meaningful once the range spans more than one), and `insights` may include `peak_month` ('which month in this period spent the most'), `peak_month_vs_previous` (that month vs. the previous equivalent period's own peak month), and `peak_quarter` entries built directly from those two fields - use them instead of trying to eyeball a 'busiest month' from the category/transaction lists yourself.";

const PERIOD_SUMMARY_INSTRUCTIONS =
  "These figures are already computed and correct - never recalculate or invent numbers from them. `currentRange`/`previousRange` give the exact dates this covers - always ground your answer in them (e.g. state the actual period, don't just say 'this period'). Your job is to synthesize this into a short but insight-dense narrative: one headline number for the period, then whatever 3-5 things genuinely matter - trend shifts, budget patterns, anomalies worth flagging, which month or quarter drove the period, a clarifying question - not a fixed template. Use `insights` as a starting point but weigh the rest of the data too." +
  PERIOD_ANALYSIS_NOTE +
  ANALYSIS_DEPTH_NOTE +
  CURRENCY_NOTE +
  " Reply in the same language the user is writing/speaking in. Close by asking a specific follow-up grounded in something you actually found - if they want to go deeper, call get_period_summary_detailed. If they name two specific periods to compare directly (e.g. 'this year vs last year'), use compare_periods instead of calling this tool twice yourself. If they ask about upcoming cashflow or future balance, call get_projections instead.";

const PERIOD_DETAILED_INSTRUCTIONS =
  "These figures are already computed and correct - never recalculate or invent numbers from them. This is the full, unfiltered dataset behind the summary you already gave for this exact range (`currentRange`/`previousRange`) - use the full detail available (the complete top-12 lists, each budget's full monthly history, every month's champion in `monthlyChampions`) to go deeper on what the user asked about, not to repeat the short narrative with more decimals." +
  PERIOD_ANALYSIS_NOTE +
  ANALYSIS_DEPTH_NOTE +
  CURRENCY_NOTE +
  " Reply in the same language the user is writing/speaking in.";

const COMPARE_PERIODS_INSTRUCTIONS =
  "Both periods' figures are already computed and correct - never recalculate or invent numbers from them. `periodA`/`periodB` each carry their own label and exact date range - ground the comparison in those, not vague relative terms. Synthesize into prose (what changed, by how much, in which direction, and why if the data suggests a reason) - don't just restate two lists side by side. `budgetChanges` already merges each budget's actual-vs-goal across both periods; don't recompute it from raw totals." +
  ANALYSIS_DEPTH_NOTE +
  CURRENCY_NOTE +
  " Reply in the same language the user is writing/speaking in.";

const PROJECTIONS_INSTRUCTIONS =
  "These figures are already computed and correct - never recalculate or invent numbers from them. Every amount is already converted into `walletPrimaryCurrency` (income sources, account balances, and budget goals in a different currency were each converted at build time) - don't mention currency at all unless the user asks. Each row is one calendar month: `type` is 'actual' (closed, real transactions), 'current' (in progress - `income`/`expense` already blend real spend-so-far with the remaining shadow projection), or 'estimate' (future, projected from active budgets/income sources). `balance` is the running account total from today forward - null for a past month with no manually-set balance, unless `balanceIsEstimated` is true (a rough guess chained from the nearest real anchor - call it out as approximate if you mention it). Synthesize into prose - the trajectory of `balance` across the rows, any month where `expense` notably exceeds `income`, and whether the user is on track for whatever they asked about - don't just recite the table back as a list." +
  " Reply in the same language the user is writing/speaking in.";

// Single source of truth for the Gastify MCP tools - shared by every
// connector entry point (Claude's Authorization-header route, ChatGPT's
// URL-embedded-token route, and whatever comes next). Each entry point only
// differs in how it resolves {user, wallet} from a request; the tools
// themselves must never be duplicated. See .mds/AI_AGENT_CONNECTOR_PLAN.md.
export function buildGastifyMcpServer({ user, wallet }) {
  const server = new McpServer({ name: "gastify", version: "1.0.0" });

  server.registerTool(
    "get_context",
    {
      title: "Get context",
      description:
        "Returns everything needed to resolve real ids for create_transaction, in a single call: accounts (name + currency), categories + subcategories (including Gastify's built-in defaults), and budgets of every type (project, saving, spending). Call this once at the start of a conversation instead of making several separate lookups - cheaper and faster. Only a 'project'-type budget can be passed as create_transaction's projectId; saving/spending budgets are included here for context/reference only.",
    },
    async () => {
      const [
        categories,
        defaultCategories,
        subCategories,
        defaultSubCategories,
        accounts,
        budgets,
      ] = await Promise.all([
        Category.find({ user: user._id, wallet: wallet._id }).lean(),
        Category.find({ isDefaultCatego: true }).lean(),
        SubCategory.find({ user: user._id, wallet: wallet._id })
          .populate("fatherCategory")
          .lean(),
        SubCategory.find({ isDefaultSubCatego: true })
          .populate("fatherCategory")
          .lean(),
        Account.find({ user: user._id, wallet: wallet._id })
          .sort({ order: 1, createdAt: 1 })
          .lean(),
        Budget.find({ user: user._id, wallet: wallet._id, archived: { $ne: true } }).lean(),
      ]);
      const payload = {
        categories: [...categories, ...defaultCategories].map((c) => ({
          id: String(c._id),
          name: c.name,
        })),
        subCategories: [...subCategories, ...defaultSubCategories].map((s) => ({
          id: String(s._id),
          name: s.name,
          fatherCategoryId: s.fatherCategory ? String(s.fatherCategory._id) : null,
        })),
        accounts: accounts.map((a) => ({
          id: String(a._id),
          name: a.name,
          currency: a.currency,
        })),
        budgets: budgets.map((b) => ({
          id: String(b._id),
          name: b.name,
          budgetType: b.budgetType || (b.isSaving ? "saving" : "spending"),
        })),
      };
      return { content: [{ type: "text", text: JSON.stringify(payload) }] };
    }
  );

  server.registerTool(
    "create_transaction",
    {
      title: "Create transaction",
      description:
        "Creates a single real transaction in the user's Gastify wallet right now. Resolve categoryId/subCategoryId/accountId/projectId via get_context first - never invent an id. Omit date to use the current time. If the user described several transactions in one message, use create_transactions instead - it's one call instead of several.",
      inputSchema: transactionInputShape,
    },
    async (args) => {
      const summary = await createOneTransaction({ user, wallet }, args);
      return { content: [{ type: "text", text: summary }] };
    }
  );

  server.registerTool(
    "create_transactions",
    {
      title: "Create multiple transactions",
      description:
        "Creates several real transactions in one call - use this instead of calling create_transaction repeatedly whenever the user described more than one transaction in the same message (e.g. 'gasté 50 en tacos, 30 en uber y 100 en super'). Each entry is independent (its own amount/account/category/etc, same fields as create_transaction). Transactions are created one by one server-side; if one entry fails (e.g. a bad id) the rest still get created - the response reports each entry's result individually so you can tell the user exactly what happened.",
      inputSchema: {
        transactions: z
          .array(z.object(transactionInputShape))
          .min(1)
          .max(20)
          .describe("One entry per transaction to create, in the order given."),
      },
    },
    async ({ transactions }) => {
      const results = [];
      for (let i = 0; i < transactions.length; i++) {
        try {
          const summary = await createOneTransaction({ user, wallet }, transactions[i]);
          results.push(`${i + 1}. OK - ${summary}`);
        } catch (e) {
          results.push(`${i + 1}. FAILED - ${e.message || e}`);
        }
      }
      return { content: [{ type: "text", text: results.join("\n") }] };
    }
  );

  server.registerTool(
    "get_monthly_summary",
    {
      title: "Get monthly summary",
      description:
        "Returns a curated, cost-conscious snapshot of the user's wallet for one calendar month (defaults to the current month): totals, pre-prioritized insights, budget status, top-6 categories/transactions, subscriptions, spending pace, weekday pattern, and savings-rate history. Call this first for any 'how was my month' / monthly summary request. Call get_monthly_summary_detailed only if the user asks to go deeper afterward, and call compare_months instead of calling this tool twice if the user names two specific months to compare directly.",
      inputSchema: monthYearInputShape,
    },
    async ({ month, year }) => {
      const referenceDate = resolveReferenceDate({ month, year });
      const { transactions, budgets } = await fetchTransactionsAndBudgets(
        { user, wallet },
        { from: getSnapshotLookbackStart(referenceDate) }
      );
      const snapshot = buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate });
      const walletPrimaryCurrency = wallet.primaryCurrency || "MXN";
      const data = {
        ...buildCuratedWalletSummary(snapshot),
        walletPrimaryCurrency,
        currencyBreakdown: {
          current: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, snapshot.currentRange),
          previous: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, snapshot.previousRange),
        },
      };
      return {
        content: [{ type: "text", text: JSON.stringify({ data, instructions: MONTHLY_SUMMARY_INSTRUCTIONS }) }],
      };
    }
  );

  server.registerTool(
    "get_monthly_summary_detailed",
    {
      title: "Get detailed monthly summary",
      description:
        "Returns the full, unfiltered wallet snapshot for one calendar month (defaults to the current month): top-12 categories/transactions, each budget's full 12-month history, 12-month monthly champions, and biggest-spend patterns. A larger payload than get_monthly_summary - only call this after that one, when the user asks to go deeper into something specific.",
      inputSchema: monthYearInputShape,
    },
    async ({ month, year }) => {
      const referenceDate = resolveReferenceDate({ month, year });
      const { transactions, budgets } = await fetchTransactionsAndBudgets(
        { user, wallet },
        { from: getSnapshotLookbackStart(referenceDate) }
      );
      const snapshot = buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate });
      const walletPrimaryCurrency = wallet.primaryCurrency || "MXN";
      const data = {
        ...snapshot,
        walletPrimaryCurrency,
        currencyBreakdown: {
          current: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, snapshot.currentRange),
          previous: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, snapshot.previousRange),
        },
      };
      return {
        content: [{ type: "text", text: JSON.stringify({ data, instructions: DETAILED_SUMMARY_INSTRUCTIONS }) }],
      };
    }
  );

  server.registerTool(
    "compare_months",
    {
      title: "Compare two months",
      description:
        "Directly compares two specific calendar months against each other (not necessarily adjacent) - each month's totals plus a category/transaction-level diff between them. Use this instead of calling get_monthly_summary twice when the user names two specific months to compare directly (e.g. 'compara enero contra diciembre').",
      inputSchema: {
        monthA: z
          .object({ month: z.number().int().min(1).max(12), year: z.number().int() })
          .describe("The first month to compare, e.g. { month: 1, year: 2026 } for January 2026."),
        monthB: z
          .object({ month: z.number().int().min(1).max(12), year: z.number().int() })
          .describe("The second month to compare."),
      },
    },
    async ({ monthA, monthB }) => {
      const dateA = new Date(monthA.year, monthA.month - 1, 1);
      const dateB = new Date(monthB.year, monthB.month - 1, 1);
      const rangeA = getMonthRange(dateA);
      const rangeB = getMonthRange(dateB);
      const { transactions } = await fetchTransactionsAndBudgets(
        { user, wallet },
        {
          from: rangeA.start < rangeB.start ? rangeA.start : rangeB.start,
          to: rangeA.end > rangeB.end ? rangeA.end : rangeB.end,
        }
      );
      const walletPrimaryCurrency = wallet.primaryCurrency || "MXN";
      const data = {
        ...buildMonthComparison({ transactions, monthADate: dateA, monthBDate: dateB }),
        walletPrimaryCurrency,
        currencyBreakdown: {
          monthA: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, rangeA),
          monthB: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, rangeB),
        },
      };
      return {
        content: [{ type: "text", text: JSON.stringify({ data, instructions: COMPARE_MONTHS_INSTRUCTIONS }) }],
      };
    }
  );

  server.registerTool(
    "get_period_summary",
    {
      title: "Get period summary",
      description:
        "Returns a curated, cost-conscious snapshot of the user's wallet for an arbitrary multi-month period - 'last 3/6/12 months', a calendar quarter/half/year, or a fully custom date range (see input for exact preset names). Always auto-compares against the immediately preceding equivalent period, so no separate call is needed for basic trend context. Call this for any 'how are my last N months going' / 'how's this quarter/year' request. Call get_period_summary_detailed only if the user asks to go deeper, compare_periods if they name two specific periods to compare directly (e.g. 'this year vs last year'), get_projections for future cashflow, and get_monthly_summary instead if they're asking about one specific calendar month.",
      inputSchema: periodInputShape,
    },
    async ({ preset, from, to }) => {
      const { range } = resolvePeriodRange({ preset, from, to });
      const { transactions, budgets } = await fetchTransactionsAndBudgets(
        { user, wallet },
        { from: getPeriodSnapshotLookbackStart(range) }
      );
      const snapshot = buildPeriodSnapshot({ transactions, budgets, range });
      const walletPrimaryCurrency = wallet.primaryCurrency || "MXN";
      const data = {
        ...buildCuratedPeriodSummary(snapshot),
        walletPrimaryCurrency,
        currencyBreakdown: {
          current: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, snapshot.currentRange),
          previous: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, snapshot.previousRange),
        },
      };
      return {
        content: [{ type: "text", text: JSON.stringify({ data, instructions: PERIOD_SUMMARY_INSTRUCTIONS }) }],
      };
    }
  );

  server.registerTool(
    "get_period_summary_detailed",
    {
      title: "Get detailed period summary",
      description:
        "Returns the full, unfiltered wallet snapshot for an arbitrary multi-month period (same period options as get_period_summary): top-12 categories/transactions, each budget's full monthly history, every calendar month's champion (biggest transaction/category/subcategory) inside the range, and biggest-spend patterns. A larger payload than get_period_summary - only call this after that one, when the user asks to go deeper into something specific.",
      inputSchema: periodInputShape,
    },
    async ({ preset, from, to }) => {
      const { range } = resolvePeriodRange({ preset, from, to });
      const { transactions, budgets } = await fetchTransactionsAndBudgets(
        { user, wallet },
        { from: getPeriodSnapshotLookbackStart(range) }
      );
      const snapshot = buildPeriodSnapshot({ transactions, budgets, range });
      const walletPrimaryCurrency = wallet.primaryCurrency || "MXN";
      const data = {
        ...snapshot,
        walletPrimaryCurrency,
        currencyBreakdown: {
          current: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, snapshot.currentRange),
          previous: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, snapshot.previousRange),
        },
      };
      return {
        content: [{ type: "text", text: JSON.stringify({ data, instructions: PERIOD_DETAILED_INSTRUCTIONS }) }],
      };
    }
  );

  server.registerTool(
    "compare_periods",
    {
      title: "Compare two periods",
      description:
        "Directly compares two arbitrary multi-month periods against each other (e.g. 'this year vs last year', 'this quarter vs last quarter', or two fully custom date ranges) - each period's totals plus a category/transaction/budget-level diff between them. Use this instead of calling get_period_summary twice when the user names two specific periods to compare directly. periodB defaults to the period immediately preceding periodA (same width) if omitted - so passing only periodA still gives a meaningful comparison.",
      inputSchema: {
        periodA: z.object(periodInputShape).optional().describe("The primary period, e.g. { preset: 'this_year' }. Defaults to last_3_months if omitted."),
        periodB: z.object(periodInputShape).optional().describe("The period to compare against, e.g. { preset: 'last_year' }. Defaults to the period immediately preceding periodA if omitted."),
      },
    },
    async ({ periodA, periodB }) => {
      const resolvedA = resolvePeriodRange(periodA || {});
      const resolvedB = periodB
        ? resolvePeriodRange(periodB)
        : { range: getPrecedingPeriods(resolvedA.range, 1)[0], label: `Previous ${resolvedA.label.toLowerCase()}` };
      const { transactions, budgets } = await fetchTransactionsAndBudgets(
        { user, wallet },
        {
          from: resolvedA.range.start < resolvedB.range.start ? resolvedA.range.start : resolvedB.range.start,
          to: resolvedA.range.end > resolvedB.range.end ? resolvedA.range.end : resolvedB.range.end,
        }
      );
      const walletPrimaryCurrency = wallet.primaryCurrency || "MXN";
      const data = {
        ...buildPeriodComparison({
          transactions,
          budgets,
          rangeA: resolvedA.range,
          rangeB: resolvedB.range,
          labelA: resolvedA.label,
          labelB: resolvedB.label,
        }),
        walletPrimaryCurrency,
        currencyBreakdown: {
          periodA: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, resolvedA.range),
          periodB: buildCurrencyBreakdown(transactions, walletPrimaryCurrency, resolvedB.range),
        },
      };
      return {
        content: [{ type: "text", text: JSON.stringify({ data, instructions: COMPARE_PERIODS_INSTRUCTIONS }) }],
      };
    }
  );

  server.registerTool(
    "get_projections",
    {
      title: "Get cashflow projections",
      description:
        "Returns month-by-month projected income, expense, net, and running account balance for an arbitrary period (same preset options as get_period_summary, but defaults to 'this_year' instead of 'last_3_months' since projections are inherently forward-looking). Built from the user's active budgets, income sources, and a running balance anchored to their accounts' current totals - the same data behind the app's own Projections page. Use this for any 'will I have enough', 'what's my balance going to look like', or 'am I on track' question - never estimate a future balance yourself from a period summary's totals.",
      inputSchema: {
        preset: z.enum(PERIOD_PRESETS).optional().describe("Same semantics as get_period_summary's preset. Defaults to 'this_year' if neither this nor from/to is given."),
        from: periodInputShape.from,
        to: periodInputShape.to,
      },
    },
    async ({ preset, from, to }) => {
      const { range } = resolvePeriodRange({ preset: preset || (from && to ? undefined : "this_year"), from, to });
      // buildYearProjectionTable computes every month of each touched
      // calendar year (not just the requested sub-range) so the running
      // balance chain can correctly tell where "today" falls - fetching
      // only the requested sub-range's transactions would leave the actual
      // current month looking like $0 spend whenever the requested range
      // doesn't happen to include it (e.g. asking for Q4 while today is in
      // Q2), silently corrupting every later month's running balance.
      const fetchFrom = new Date(range.start.getFullYear(), 0, 1);
      const fetchTo = new Date(range.end.getFullYear(), 11, 31, 23, 59, 59, 999);
      const { transactions, budgets } = await fetchTransactionsAndBudgets({ user, wallet }, { from: fetchFrom, to: fetchTo });
      const data = await buildProjectionsForRange({ user, wallet, transactions, budgets, range });
      return {
        content: [{ type: "text", text: JSON.stringify({ data, instructions: PROJECTIONS_INSTRUCTIONS }) }],
      };
    }
  );

  return server;
}

// Boilerplate shared by every MCP HTTP entry point: build the tools for the
// resolved {user, wallet}, connect a fresh stateless transport, and hand off
// the raw Request to it. See buildGastifyMcpServer's stateless-mode note in
// each route for why a fresh server/transport per request is correct here.
export async function handleGastifyMcpTransport(auth, request) {
  const server = buildGastifyMcpServer(auth);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
