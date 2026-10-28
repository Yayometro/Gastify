// "Eliminar mi cuenta": the checks the app makes before calling the server (the server repeats them) and the text of
// its answer. Same rules as the web's DeleteAccountPanel and `general-data/user/remove-user`: the account e-mail
// typed again and a fresh code of the authenticator app (or a backup code).
export type SecondFactorMethod = "totp" | "backup";

export interface DeleteAccountInput {
  accountEmail: string;
  confirmMail: string;
  code: string;
  method: SecondFactorMethod;
}

// A typo in the e-mail must not cost a request (or a failed-attempt count on the server).
export function validateDeleteAccount(input: DeleteAccountInput): string | null {
  if (input.confirmMail.trim().toLowerCase() !== input.accountEmail.trim().toLowerCase()) {
    return "profile.delete.mailMismatch";
  }
  if (!input.code.trim()) {
    return input.method === "backup" ? "profile.delete.backupRequired" : "profile.delete.appCodeRequired";
  }
  if (input.method === "totp" && !/^\d{6}$/.test(input.code.trim())) return "profile.delete.codeDigits";
  return null;
}

export interface RemoveUserAnswer {
  ok?: boolean;
  message?: string;
  attemptsLeft?: number;
  retryAfterMinutes?: number;
}

// The text of the server’s answer. The server writes its own message in the language of the request; the fallback and the
// attempts are the app’s, so they come from the catalog through `t`.
export function deleteAccountErrorText(answer: RemoveUserAnswer | null | undefined, t: (key: string, params?: Record<string, string | number>) => string): string {
  const base = answer?.message || t("profile.delete.failed");
  if (typeof answer?.attemptsLeft === "number") return `${base} ${t("profile.delete.attemptsLeft", { p1: answer.attemptsLeft })}`;
  if (answer?.retryAfterMinutes) return `${base} ${t("profile.delete.retryIn", { p1: answer.retryAfterMinutes })}`;
  return base;
}
