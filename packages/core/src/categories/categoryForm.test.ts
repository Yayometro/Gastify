import { describe, it, expect } from "vitest";

import { idOf, subCategoriesOf, validateCategoryName } from "./categoryForm";

describe("validateCategoryName", () => {
  it("needs a name of at most 40 characters", () => {
    expect(validateCategoryName("  ")).toBe("accounts.error.nameRequired");
    expect(validateCategoryName("x".repeat(41))).toBeDefined();
    expect(validateCategoryName("Comida")).toBeNull();
  });
});

describe("idOf and subCategoriesOf", () => {
  it("reads plain ids and populated references", () => {
    expect(idOf("abc")).toBe("abc");
    expect(idOf({ _id: "abc", name: "Comida" })).toBe("abc");
    expect(idOf(null)).toBe("");
  });

  it("keeps the sub-categories of one category", () => {
    const list = [
      { _id: "s1", fatherCategory: "c1" },
      { _id: "s2", fatherCategory: { _id: "c2" } },
      { _id: "s3", fatherCategory: { _id: "c1" } },
    ];
    expect(subCategoriesOf(list, "c1").map((s) => s._id)).toEqual(["s1", "s3"]);
  });
});
