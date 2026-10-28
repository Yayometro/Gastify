// The admin check for the routes and the server actions of the panel. It is the same rule as the layout (src/app/admin/layout.tsx):
// a session, an email on the ADMIN_EMAILS list, and a second factor passed recently. Anything else gets null, and the caller
// answers as if the page did not exist.
import { auth, recordSessionActivity } from "@/lib/auth/betterAuth";
import { evaluateApiStepUp } from "@/lib/auth/stepUpPolicy";
import { isAdminEmail } from "./adminAccess";

export interface AdminCaller {
  email: string;
  userId: string;
}

export async function adminCaller(headers: Headers): Promise<AdminCaller | null> {
  const session = await auth.api.getSession({ headers });
  if (!session || !session.user?.email) return null;
  if (!isAdminEmail(session.user.email)) return null;
  const stepUp = evaluateApiStepUp(session.session);
  if ("reason" in stepUp) return null;
  if (stepUp.shouldRecordActivity) await recordSessionActivity(session.session.token).catch(() => {});
  return { email: session.user.email, userId: session.user.id };
}
