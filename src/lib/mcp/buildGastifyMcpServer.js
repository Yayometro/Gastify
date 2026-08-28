import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { createTransaction } from "@/lib/transactions/createTransaction";
import { formatMoneyMinor } from "@/lib/money/currencies";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Account from "@/model/Account";
import Budget from "@/model/Budget";

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
