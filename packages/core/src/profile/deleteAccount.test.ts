import { describe, it, expect } from "vitest";

import { deleteAccountErrorText, validateDeleteAccount } from "./deleteAccount";

const base = { accountEmail: "Ada@Example.com", confirmMail: " ada@example.com ", code: "123456", method: "totp" as const };

describe("validateDeleteAccount", () => {
  it("accepts the same e-mail (ignoring case and spaces) and a 6-digit code", () => {
    expect(validateDeleteAccount(base)).toBeNull();
  });
  it("rejects a different e-mail before anything else", () => {
    expect(validateDeleteAccount({ ...base, confirmMail: "otra@example.com", code: "" })).toBe("El correo escrito no coincide con el de tu cuenta.");
  });
  it("asks for the code and checks the length of an authenticator code", () => {
    expect(validateDeleteAccount({ ...base, code: " " })).toContain("autenticadora");
    expect(validateDeleteAccount({ ...base, code: "12345" })).toContain("6 dígitos");
    expect(validateDeleteAccount({ ...base, code: "abc123" })).toContain("6 dígitos");
  });
  it("takes any backup code", () => {
    expect(validateDeleteAccount({ ...base, method: "backup", code: "abcde-12345" })).toBeNull();
    expect(validateDeleteAccount({ ...base, method: "backup", code: "" })).toContain("respaldo");
  });
});

describe("deleteAccountErrorText", () => {
  it("adds the attempts left or the wait time to the server message", () => {
    expect(deleteAccountErrorText({ message: "Código incorrecto.", attemptsLeft: 2 })).toBe("Código incorrecto. Te quedan 2 intento(s).");
    expect(deleteAccountErrorText({ message: "Demasiados intentos.", retryAfterMinutes: 15 })).toBe("Demasiados intentos. Intenta de nuevo en 15 min.");
    expect(deleteAccountErrorText({ message: "Otro error." })).toBe("Otro error.");
    expect(deleteAccountErrorText(null)).toBe("No se pudo eliminar la cuenta.");
  });
});
