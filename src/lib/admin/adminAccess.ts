// Who may open the platform admin (/admin). The allowlist is the ADMIN_EMAILS environment variable: a comma separated list of
// account emails. Nothing is stored in the database, so no profile route, Mongoose field or Better Auth call can ever promote an
// account to admin; changing the list means changing the server's environment. Empty or missing means nobody is admin.

// The emails of the variable, trimmed and in lower case, without blanks.
export function parseAdminEmails(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export function isAdminEmail(email: string | null | undefined, raw: string | null | undefined = process.env.ADMIN_EMAILS): boolean {
  if (!email) return false;
  return parseAdminEmails(raw).includes(email.trim().toLowerCase());
}
