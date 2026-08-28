import { getUserFromApiToken } from "@/lib/auth/apiTokens";
import { handleGastifyMcpTransport } from "@/lib/mcp/buildGastifyMcpServer";

// Remote MCP server for Claude's custom connector (header-based auth) - see
// .mds/AI_AGENT_CONNECTOR_PLAN.md. Runs on Gastify's own Vercel deployment
// (no local process, no user device required). Every request is
// authenticated per-call via a personal access token, and a fresh
// McpServer/transport pair is built per request (stateless mode) so the
// resolved {user, wallet} can just be closed over by the tool handlers
// instead of threaded through the SDK's OAuth-oriented auth plumbing.
async function handleMcpRequest(request) {
  let auth;
  try {
    auth = await getUserFromApiToken(request);
  } catch (e) {
    return Response.json({ error: e.message || "Unauthorized" }, { status: 401 });
  }
  return handleGastifyMcpTransport(auth, request);
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
