import { resolveApiToken } from "@/lib/auth/apiTokens";
import { handleGastifyMcpTransport } from "@/lib/mcp/buildGastifyMcpServer";

// Remote MCP server for connectors that can't send a custom Authorization
// header the way Claude's connector setup does (ChatGPT's Developer Mode is
// OAuth-first and has no confirmed "static Bearer token" option). The
// personal access token is embedded in the URL itself instead - the same
// pattern used by e.g. Slack's incoming webhook URLs. Anyone who obtains
// this exact URL can act as the user, so treat it exactly like the raw
// token: never log it, never share it, and revoke it from Profile if it
// leaks. Shares every tool and the token-verification logic with Claude's
// header-based /api/mcp route - only the auth extraction differs. See
// .mds/AI_AGENT_CONNECTOR_PLAN.md.
async function handleMcpRequest(request, { params }) {
  let auth;
  try {
    auth = await resolveApiToken(params.token);
  } catch (e) {
    return Response.json({ error: e.message || "Unauthorized" }, { status: 401 });
  }
  return handleGastifyMcpTransport(auth, request);
}

export async function POST(request, context) {
  return handleMcpRequest(request, context);
}

export async function GET(request, context) {
  return handleMcpRequest(request, context);
}

export async function DELETE(request, context) {
  return handleMcpRequest(request, context);
}
