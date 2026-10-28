// Deleting one person's account and everything that belongs to it. Irreversible, so the rules are in code, not in the screen:
//   - an admin never deletes their own account from the panel;
//   - an account on the ADMIN_EMAILS list is never deleted (take it off the list first, on purpose);
//   - the QA base account is never deleted (.mds/QA_ACCOUNT.md);
//   - the person's identifier must be typed back (its last six characters), so a click alone cannot delete anything.
// The preview counts documents without changing anything; deletion is a separate call.
import { ObjectId } from "mongodb";

// The QA base account: kept forever for tests. Its registry is .mds/QA_ACCOUNT.md.
export const PROTECTED_EMAILS: readonly string[] = ["qa.movil.d6be4e@example.com"];

// Every collection that holds one person's data, and the field that points at the person. `_id` is the user document itself.
export const PERSON_COLLECTIONS: readonly { name: string; field: "user" | "userId" | "_id"; label: string }[] = [
  { name: "transactions", field: "user", label: "Transacciones" },
  { name: "accounts", field: "user", label: "Cuentas de la billetera" },
  { name: "categories", field: "user", label: "Categorías" },
  { name: "subcategories", field: "user", label: "Subcategorías" },
  { name: "tags", field: "user", label: "Etiquetas" },
  { name: "budgets", field: "user", label: "Presupuestos" },
  { name: "categoryrules", field: "user", label: "Reglas de categorización" },
  { name: "incomesources", field: "user", label: "Fuentes de ingreso" },
  { name: "projectionsettings", field: "user", label: "Ajustes de proyección" },
  { name: "projectionbaselines", field: "user", label: "Bases de proyección" },
  { name: "wallets", field: "user", label: "Billetera" },
  { name: "account", field: "userId", label: "Métodos de acceso" },
  { name: "session", field: "userId", label: "Sesiones" },
  { name: "passkey", field: "userId", label: "Passkeys" },
  { name: "twoFactor", field: "userId", label: "Verificación en dos pasos" },
  { name: "users", field: "_id", label: "Cuenta" },
];

// The filter for one collection: the id in both forms (ObjectId and string), since older rows may store either.
export function accountFilter(field: "user" | "userId" | "_id", userId: string): Record<string, unknown> {
  const objectId = new ObjectId(userId);
  if (field === "_id") return { _id: { $in: [objectId] } };
  return { [field]: { $in: [objectId, userId] } };
}

// The six characters the admin must type to delete this account.
export function confirmationCode(userId: string): string {
  return userId.slice(-6);
}

export function confirmationMatches(userId: string, typed: string): boolean {
  return typed.trim().toLowerCase() === confirmationCode(userId);
}

// Why this account may not be deleted from the panel, or null when it may (after the confirmation is also right).
export function deletionBlock(input: {
  userId: string;
  email: string | null | undefined;
  selfId: string;
  adminEmails: readonly string[];
}): "self" | "admin" | "protected" | null {
  if (input.userId === input.selfId) return "self";
  const email = input.email?.trim().toLowerCase() ?? "";
  if (email && input.adminEmails.map((mail) => mail.trim().toLowerCase()).includes(email)) return "admin";
  if (email && PROTECTED_EMAILS.map((mail) => mail.toLowerCase()).includes(email)) return "protected";
  return null;
}

export interface CollectionCount {
  name: string;
  label: string;
  documents: number;
}

// How many documents of this person each collection holds. Reads only.
export async function previewAccountDeletion(userId: string): Promise<CollectionCount[]> {
  const db = await loadDb();
  const counts: CollectionCount[] = [];
  for (const collection of PERSON_COLLECTIONS) {
    const documents = await db.collection(collection.name).countDocuments(accountFilter(collection.field, userId));
    counts.push({ name: collection.name, label: collection.label, documents });
  }
  return counts;
}

// Deletes the person's documents, dependants first and the user document last. Returns what was removed, for the audit trail.
export async function deleteAccountData(userId: string): Promise<CollectionCount[]> {
  const db = await loadDb();
  const removed: CollectionCount[] = [];
  for (const collection of PERSON_COLLECTIONS) {
    const result = await db.collection(collection.name).deleteMany(accountFilter(collection.field, userId));
    removed.push({ name: collection.name, label: collection.label, documents: result.deletedCount ?? 0 });
  }
  return removed;
}

// The account's own address, read on the server only to apply the rules above. Never shown in the panel.
export async function readAccountEmail(userId: string): Promise<string | null> {
  const db = await loadDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) }, { projection: { mail: 1 } });
  return typeof user?.mail === "string" ? user.mail : null;
}

export function totalDocuments(counts: CollectionCount[]): number {
  return counts.reduce((sum, entry) => sum + entry.documents, 0);
}

async function loadDb() {
  const { adminDb } = await import("./adminDb");
  return adminDb();
}
