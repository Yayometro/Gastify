export interface OwnableDocument {
  user?: unknown;
  wallet?: unknown;
}

// Throws `message` unless `doc` exists and either carries `defaultFlag` (a
// shared default, usable by any user) or actually belongs to this user's
// wallet. Deliberately uses the same "not found" message whether the id
// doesn't exist at all or exists but belongs to someone else - an agent
// (or any caller) shouldn't be able to distinguish "no such id" from
// "that id isn't yours" by probing ids.
export function assertOwnedOrDefault<T extends OwnableDocument>(
  doc: T | null | undefined,
  user: unknown,
  wallet: unknown,
  message: string,
  defaultFlag?: string
): T {
  if (!doc) throw new Error(message);
  if (defaultFlag && (doc as Record<string, unknown>)[defaultFlag]) return doc;
  if (String(doc.user) !== String(user) || String(doc.wallet) !== String(wallet)) {
    throw new Error(message);
  }
  return doc;
}
