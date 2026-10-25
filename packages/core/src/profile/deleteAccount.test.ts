import { describe, it, expect } from "vitest";

import { deleteAccountErrorText, validateDeleteAccount } from "./deleteAccount";

const base = { accountEmail: "Ada@Example.com", confirmMail: " ada@example.com ", code: "123456", method: "totp" as const };

// A stand-in for the app's translator: the Spanish of each key, with its {p1}.
const es: Record<string, string> = {
  "profile.delete.failed": "No se pudo eliminar la cuenta.",
  "profile.delete.attemptsLeft": "Te quedan {p1} intento(s).",
  "profile.delete.retryIn": "Intenta de nuevo en {p1} min.",
};
const t = (key: string, params?: Record<string, string | number>) =>
  (es[key] ?? key).replace(/\{(\w+)\}/g, (match, name: string) => (params && name in params ? String(params[name]) : match));

describe("validateDeleteAccount", () => {
  it("accepts the same e-mail (ignoring case and spaces) and a 6-digit code", () => {
    expect(validateDeleteAccount(base)).toBeNull();
  });
  it("rejects a different e-mail before anything else", () => {
    expect(validateDeleteAccount({ ...base, confirmMail: "otra@example.com", code: "" })).toBe("profile.delete.mailMismatch");
  });
  it("asks for the code and checks the length of an authenticator code", () => {
    expect(validateDeleteAccount({ ...base, code: " " })).toBe("profile.delete.appCodeRequired");
    expect(validateDeleteAccount({ ...base, code: "12345" })).toBe("profile.delete.codeDigits");
    expect(validateDeleteAccount({ ...base, code: "abc123" })).toBe("profile.delete.codeDigits");
  });
  it("takes any backup code", () => {
    expect(validateDeleteAccount({ ...base, method: "backup", code: "abcde-12345" })).toBeNull();
    expect(validateDeleteAccount({ ...base, method: "backup", code: "" })).toBe("profile.delete.backupRequired");
  });
});

describe("deleteAccountErrorText", () => {
  it("adds the attempts left or the wait time to the server message", () => {
    expect(deleteAccountErrorText({ message: "Código incorrecto.", attemptsLeft: 2 }, t)).toBe("Código incorrecto. Te quedan 2 intento(s).");
    expect(deleteAccountErrorText({ message: "Demasiados intentos.", retryAfterMinutes: 15 }, t)).toBe("Demasiados intentos. Intenta de nuevo en 15 min.");
    expect(deleteAccountErrorText({ message: "Otro error." }, t)).toBe("Otro error.");
    expect(deleteAccountErrorText(null, t)).toBe("No se pudo eliminar la cuenta.");
  });
});
