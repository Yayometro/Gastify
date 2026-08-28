import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { getUserFromApiToken } from "@/lib/auth/apiTokens";
import { createTransaction } from "@/lib/transactions/createTransaction";
import { formatMoneyMinor } from "@/lib/money/currencies";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Account from "@/model/Account";
import Budget from "@/model/Budget";

// Remote MCP server for third-party AI-agent connectors (Claude, later
// ChatGPT) - see .mds/AI_AGENT_CONNECTOR_PLAN.md. Runs on Gastify's own
// Vercel deployment (no local process, no user device required). Every
// request is authenticated per-call via a personal access token, and a
// fresh McpServer/transport pair is built per request (stateless mode) so
// the resolved {user, wallet} can just be closed over by the tool handlers
// instead of threaded through the SDK's OAuth-oriented auth plumbing.
function buildServer({ user, wallet }) {
  const server = new McpServer({ name: "gastify", version: "1.0.0" });

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description:
        "Lists this user's transaction categories and subcategories (including Gastify's built-in default ones). Call this before create_transaction to resolve a real categoryId/subCategoryId from what the user said - never invent an id.",
    },
    async () => {
      const [categories, defaultCategories, subCategories, defaultSubCategories] =
        await Promise.all([
          Category.find({ user: user._id, wallet: wallet._id }).lean(),
          Category.find({ isDefaultCatego: true }).lean(),
          SubCategory.find({ user: user._id, wallet: wallet._id })
            .populate("fatherCategory")
            .lean(),
          SubCategory.find({ isDefaultSubCatego: true })
            .populate("fatherCategory")
            .lean(),
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
      };
      return { content: [{ type: "text", text: JSON.stringify(payload) }] };
    }
  );

  server.registerTool(
    "list_accounts",
    {
      title: "List accounts",
      description:
        "Lists this user's accounts (name + native currency). Call this before create_transaction to resolve a real accountId - never invent an id. Omitting accountId on create_transaction makes a wallet-level transaction in the wallet's primary currency instead.",
    },
    async () => {
      const accounts = await Account.find({ user: user._id, wallet: wallet._id })
        .sort({ order: 1, createdAt: 1 })
        .lean();
      const payload = accounts.map((a) => ({
        id: String(a._id),
        name: a.name,
        currency: a.currency,
      }));
      return { content: [{ type: "text", text: JSON.stringify(payload) }] };
    }
  );

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description:
        "Lists this user's project budgets. A transaction can only link directly to a 'project' budget - saving/spending budgets aggregate from linked accounts instead, not from individual transactions. Call this before create_transaction if the user mentions a project by name.",
    },
    async () => {
      const projects = await Budget.find({
        user: user._id,
        wallet: wallet._id,
        budgetType: "project",
        archived: { $ne: true },
      }).lean();
      const payload = projects.map((p) => ({ id: String(p._id), name: p.name }));
      return { content: [{ type: "text", text: JSON.stringify(payload) }] };
    }
  );

  server.registerTool(
    "create_transaction",
    {
      title: "Create transaction",
      description:
        "Creates a real transaction in the user's Gastify wallet right now. Resolve categoryId/subCategoryId/accountId/projectId via list_categories/list_accounts/list_projects first - never invent an id. Omit date to use the current time.",
      inputSchema: {
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
            "An id from list_accounts. Omit for a wallet-level transaction (uses the wallet's primary currency)."
          ),
        categoryId: z.string().optional().describe("A category id from list_categories."),
        subCategoryId: z
          .string()
          .optional()
          .describe(
            "A subcategory id from list_categories. If set, its parent category is applied automatically."
          ),
        projectId: z
          .string()
          .optional()
          .describe("A project id from list_projects, if the user mentioned linking this to a project."),
        tags: z
          .array(z.string())
          .optional()
          .describe("Tag names to attach, e.g. ['trip-cancun']. Created automatically if new."),
        date: z
          .string()
          .optional()
          .describe(
            "ISO 8601 date/time. Omit if the user didn't say when it happened - defaults to now."
          ),
      },
    },
    async ({ amount, name, isIncome, accountId, categoryId, subCategoryId, projectId, tags, date }) => {
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
      const formattedAmount = native
        ? formatMoneyMinor(native.amountMinor, native.currency)
        : `${amount}`;
      const summary = [
        `Created "${resolvedName}": ${formattedAmount}`,
        transaction.date ? `on ${new Date(transaction.date).toLocaleDateString()}` : null,
        transaction.category?.name ? `in ${transaction.category.name}` : null,
        transaction.budget?.name ? `linked to project "${transaction.budget.name}"` : null,
      ]
        .filter(Boolean)
        .join(" ");
      return { content: [{ type: "text", text: summary }] };
    }
  );

  return server;
}

async function handleMcpRequest(request) {
  let auth;
  try {
    auth = await getUserFromApiToken(request);
  } catch (e) {
    return Response.json(
      { error: e.message || "Unauthorized" },
      { status: 401 }
    );
  }

  const server = buildServer(auth);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export async function POST(request) {
  return handleMcpRequest(request);
}

export async function GET(request) {
  return handleMcpRequest(request);
}

export async function DELETE(request) {
  return handleMcpRequest(request);
}
