import { describe, it, expect } from "vitest";

import { validateEmailAddress, validateNewPassword } from "./accessRules";

describe("validateNewPassword", () => {
  it("accepts 8+ characters with a capital and a special character", () => {
    expect(validateNewPassword("Gastify#2026", "Gastify#2026")).toBeNull();
  });
  it("rejects each missing rule with its own message", () => {
    expect(validateNewPassword("Gastify#2026", "Otra#2026")).toContain("no coinciden");
    expect(validateNewPassword("Ab#1", "Ab#1")).toContain("8 caracteres");
    expect(validateNewPassword("gastify#2026", "gastify#2026")).toContain("mayúscula");
    expect(validateNewPassword("Gastify2026", "Gastify2026")).toContain("especial");
  });
});

describe("validateEmailAddress", () => {
  it("accepts a different valid address", () => {
    expect(validateEmailAddress(" nuevo@example.com ", "viejo@example.com")).toBeNull();
  });
  it("rejects a malformed address and the same one", () => {
    expect(validateEmailAddress("no-es-correo", "a@b.co")).toBe("Escribe un correo válido.");
    expect(validateEmailAddress("A@B.co", "a@b.co")).toBe("Ese ya es tu correo.");
  });
});
