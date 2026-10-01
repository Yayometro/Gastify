// A User document carries two fields that must never reach the browser or the
// logs: the legacy `password` hash and the connector `apiTokens` (each with its
// `tokenHash`). Every route that sends a user to the client goes through this
// helper so those fields are dropped at the source instead of blanked out
// route by route.
export type PublicUser<T> = Omit<T, "password" | "apiTokens">;

interface MaybeMongooseDoc {
  toObject?: () => unknown;
}

export function toPublicUser<T extends object>(user: T): PublicUser<T> {
  const doc = user as MaybeMongooseDoc;
  const plain = (
    typeof doc.toObject === "function" ? doc.toObject() : user
  ) as Record<string, unknown>;
  const copy = { ...plain };
  delete copy.password;
  delete copy.apiTokens;
  return copy as PublicUser<T>;
}
