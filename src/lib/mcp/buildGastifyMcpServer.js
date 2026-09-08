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
import {
  buildWalletAnalyzerSnapshot,
  buildCuratedWalletSummary,
  buildMonthComparison,
  getSnapshotLookbackStart,
  getMonthRange,
} from "@/helpers/transformers/walletAnalyzer";

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

// Shared by all three wallet-analysis tools - scoping the Mongo query to a
// date range (rather than the user's entire transaction history, which is
// what the app's own get-transactions route fetches for its Redux store)
// matters here because this runs fresh on every single tool call, not once
// per page load. Every computation inside buildWalletAnalyzerSnapshot caps
// its own lookback at 12 months, so `from`/`to` only need to cover that.
async function fetchTransactionsAndBudgets({ user, wallet }, { from, to } = {}) {
  const transactionQuery = { user: user._id, wallet: wallet._id };
  if (from || to) {
    transactionQuery.date = {};
    if (from) transactionQuery.date.$gte = from;
    if (to) transactionQuery.date.$lte = to;
  }
  const [transactions, budgets] = await Promise.all([
    Transaction.find(transactionQuery)
      .populate("category")
      .populate("subCategory")
      .populate("account")
      .lean(),
    Budget.find({ user: user._id, wallet: wallet._id, archived: { $ne: true } }).lean(),
  ]);
  return { transactions, budgets };
}

// Baked into every wallet-analysis tool's *result* (not only its
// description) so the guidance survives regardless of which client is
// calling it and whether that client's model re-reads the tool description
// before using a result it already has. See .mds/AI_MONTHLY_SUMMARY_PLAN.md
// for why the AI's job here is synthesis/prioritization, never recomputing
// numbers Gastify already computed correctly.
const MONTHLY_SUMMARY_INSTRUCTIONS =
  "These figures are already computed and correct - never recalculate or invent numbers from them. Your job is to synthesize them into a short narrative (not a list of cards): one headline number for the month, 2-3 things that genuinely stand out, budget status, and one or two concrete, actionable suggestions. Use `insights` as a starting point but weigh the rest of the data too - you're not limited to only those 5 if something else here matters more for this user. Reply in the same language the user is writing/speaking in. Close by asking if they want you to go deeper into anything specific (a category, a budget, the last 12 months) - if they say yes, call get_monthly_summary_detailed for that. If they name two specific months to compare directly, use compare_months instead of calling this tool twice yourself.";

const DETAILED_SUMMARY_INSTRUCTIONS =
  "These figures are already computed and correct - never recalculate or invent numbers from them. This is the full 12-month-lookback dataset behind the summary you already gave - use it to answer the specific follow-up the user asked about, not to redo the whole monthly narrative again. Reply in the same language the user is writing/speaking in.";

const COMPARE_MONTHS_INSTRUCTIONS =
  "Both months' figures are already computed and correct - never recalculate or invent numbers from them. Synthesize the comparison into prose (what changed, by how much, in which direction) - don't just restate two lists side by side. Reply in the same language the user is writing/speaking in.";

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
      const data = buildCuratedWalletSummary(snapshot);
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
      const data = buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate });
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
      const data = buildMonthComparison({ transactions, monthADate: dateA, monthBDate: dateB });
      return {
        content: [{ type: "text", text: JSON.stringify({ data, instructions: COMPARE_MONTHS_INSTRUCTIONS }) }],
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
