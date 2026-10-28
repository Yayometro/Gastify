"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { adminCaller } from "@/lib/admin/guard";
import { adminDb } from "@/lib/admin/adminDb";
import { isObjectIdString, recordAudit } from "@/lib/admin/audit";

// Closes every session of one account (it signs out everywhere). The admin cannot do it to their own account from here, so the
// panel can never lock its own operator out. Every call is written to the audit trail before the redirect.
export async function revokeUserSessions(formData: FormData): Promise<void> {
  const caller = await adminCaller(await headers());
  if (!caller) throw new Error("No autorizado");

  const targetId = String(formData.get("userId") ?? "");
  if (!isObjectIdString(targetId)) throw new Error("Cuenta no válida");
  if (targetId === caller.userId) redirect(`/admin/usuarios/${targetId}?error=self`);

  const db = await adminDb();
  const result = await db.collection("session").deleteMany({ userId: { $in: [new ObjectId(targetId), targetId] } });
  await recordAudit({
    action: "revoke_sessions",
    adminEmail: caller.email,
    targetUserId: targetId,
    detail: `${result.deletedCount} sesiones cerradas`,
  });
  redirect(`/admin/usuarios/${targetId}?revoked=${result.deletedCount}`);
}
