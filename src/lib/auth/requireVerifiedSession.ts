import { auth, recordSessionActivity } from "./betterAuth";
import { evaluateApiStepUp } from "./stepUpPolicy";

// Drop-in for `auth.api.getSession({ headers })` in the data routes: returns the
// session only when it has also passed the second-factor step-up recently (see
// stepUpPolicy.ts), otherwise null - the routes already treat null as "No session".
// A signed-in session that never proved a second factor (a Google login that has
// not reached /verify-2fa yet, say) can no longer read or change data by calling
// the API directly, which the dashboard layout alone never prevented.
export async function getVerifiedSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const decision = evaluateApiStepUp(session.session);
  if (!decision.allowed) return null;
  if (decision.shouldRecordActivity) {
    // Best effort: a failed bookkeeping write must not turn into a failed request.
    await recordSessionActivity(session.session.token).catch(() => {});
  }
  return session;
}
