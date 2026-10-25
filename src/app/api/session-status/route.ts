import { NextResponse, type NextRequest } from "next/server";
import { auth, countUserPasskeys } from "@/lib/auth/betterAuth";
import { evaluateApiStepUp } from "@/lib/auth/stepUpPolicy";
import type { SessionStatus } from "@gastify/core/auth/sessionStatus";

// Where the caller's own session stands, for clients that cannot read the server-side redirect
// of the dashboard layout (the mobile app): is there a session, and is it still unlocked by a
// second factor? Deliberately NOT behind getVerifiedSession (it has to answer "not verified"),
// read-only, and it does not count as activity, so polling it never keeps a session alive.
export type { SessionStatus };

export async function GET(request: NextRequest | Request): Promise<NextResponse<SessionStatus>> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ ok: true, signedIn: false });

  const decision = evaluateApiStepUp(session.session);
  return NextResponse.json({
    ok: true,
    signedIn: true,
    stepUp: "reason" in decision ? decision.reason : "fresh",
    hasTwoFactor: Boolean((session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled),
    hasPasskey: (await countUserPasskeys(session.user.id)) > 0,
    email: session.user.email,
    name: session.user.name,
  });
}
