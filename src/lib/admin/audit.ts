// The admin audit trail: every action an admin takes on an account is written here, with who did it and when. Entries are never
// edited or deleted by the app. Only the account id of the person affected is stored, never their email or their data.
import { ObjectId } from "mongodb";
import { adminDb, AUDIT_COLLECTION } from "./adminDb";

export const AUDIT_ACTIONS = ["revoke_sessions", "delete_account"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntry {
  id: string;
  action: AuditAction;
  adminEmail: string;
  targetUserId: string;
  detail: string;
  at: string;
}

export async function recordAudit(entry: { action: AuditAction; adminEmail: string; targetUserId: string; detail: string }): Promise<void> {
  const db = await adminDb();
  await db.collection(AUDIT_COLLECTION).insertOne({ ...entry, at: new Date() });
}

// The latest entries, newest first, optionally only those about one account.
export async function readAudit(limit = 100, targetUserId?: string): Promise<AuditEntry[]> {
  const db = await adminDb();
  const filter = targetUserId ? { targetUserId } : {};
  const rows = await db.collection(AUDIT_COLLECTION).find(filter).sort({ at: -1 }).limit(limit).toArray();
  return rows.map((row) => ({
    id: String(row._id),
    action: row.action as AuditAction,
    adminEmail: String(row.adminEmail),
    targetUserId: String(row.targetUserId),
    detail: String(row.detail ?? ""),
    at: new Date(row.at as Date).toISOString(),
  }));
}

// Account ids come from the URL, so they are checked before they reach a query.
export function isObjectIdString(value: string): boolean {
  return ObjectId.isValid(value) && String(new ObjectId(value)) === value;
}
