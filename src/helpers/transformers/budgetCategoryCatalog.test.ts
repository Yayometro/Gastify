import { describe, expect, it } from "vitest";
import { normalizeBudgetCategoryCatalog } from "./budgetCategoryCatalog";

describe("normalizeBudgetCategoryCatalog", () => {
  it("flattens the app context's user/default category groups", () => {
    const user = [{ _id: "custom", name: "Custom" }];
    const defaults = [{ _id: "default", name: "Default" }];

    expect(normalizeBudgetCategoryCatalog({ user, default: defaults })).toEqual([...user, ...defaults]);
  });

  it("keeps an already-flat catalog intact", () => {
    const categories = [{ _id: "home", name: "Home" }];
    expect(normalizeBudgetCategoryCatalog(categories)).toEqual(categories);
  });

  it("returns an empty array for malformed category data", () => {
    expect(normalizeBudgetCategoryCatalog({ user: {}, default: null })).toEqual([]);
    expect(normalizeBudgetCategoryCatalog(null)).toEqual([]);
  });
});
