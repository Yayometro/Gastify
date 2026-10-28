"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { adminCaller } from "@/lib/admin/guard";
import { adminDb } from "@/lib/admin/adminDb";
import { isObjectIdString, recordAudit } from "@/lib/admin/audit";
import { parseAdminEmails } from "@/lib/admin/adminAccess";
import { confirmationMatches, deleteAccountData, deletionBlock, totalDocuments } from "@/lib/admin/accountDeletion";

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

// Deletes one account and everything that belongs to it. The rules (not the screen) decide: the admin's own account, any account on
// ADMIN_EMAILS and the QA base account are refused; the person's identifier must be typed back. The audit line keeps the counts,
// not the person's data.
export async function deleteAccount(formData: FormData): Promise<void> {
  const caller = await adminCaller(await headers());
  if (!caller) throw new Error("No autorizado");

  const targetId = String(formData.get("userId") ?? "");
  if (!isObjectIdString(targetId)) throw new Error("Cuenta no válida");

  const db = await adminDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(targetId) }, { projection: { mail: 1 } });
  if (!user) redirect(`/admin/usuarios/${targetId}?deleteError=missing`);

  const block = deletionBlock({
    userId: targetId,
    email: typeof user.mail === "string" ? user.mail : null,
    selfId: caller.userId,
    adminEmails: parseAdminEmails(process.env.ADMIN_EMAILS),
  });
  if (block) redirect(`/admin/usuarios/${targetId}?deleteError=${block}`);

  if (!confirmationMatches(targetId, String(formData.get("confirm") ?? ""))) {
    redirect(`/admin/usuarios/${targetId}?deleteError=confirm`);
  }

  const removed = await deleteAccountData(targetId);
  const total = totalDocuments(removed);
  await recordAudit({
    action: "delete_account",
    adminEmail: caller.email,
    targetUserId: targetId,
    detail: `${total} documentos borrados en ${removed.filter((entry) => entry.documents > 0).length} colecciones`,
  });
  redirect(`/admin/auditoria?deleted=${total}`);
}
