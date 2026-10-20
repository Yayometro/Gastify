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
    return "El correo escrito no coincide con el de tu cuenta.";
  }
  if (!input.code.trim()) {
    return input.method === "backup" ? "Escribe un código de respaldo." : "Escribe el código de tu app autenticadora.";
  }
  if (input.method === "totp" && !/^\d{6}$/.test(input.code.trim())) return "El código de tu app tiene 6 dígitos.";
  return null;
}

export interface RemoveUserAnswer {
  ok?: boolean;
  message?: string;
  attemptsLeft?: number;
  retryAfterMinutes?: number;
}

export function deleteAccountErrorText(answer: RemoveUserAnswer | null | undefined): string {
  const base = answer?.message || "No se pudo eliminar la cuenta.";
  if (typeof answer?.attemptsLeft === "number") return `${base} Te quedan ${answer.attemptsLeft} intento(s).`;
  if (answer?.retryAfterMinutes) return `${base} Intenta de nuevo en ${answer.retryAfterMinutes} min.`;
  return base;
}
