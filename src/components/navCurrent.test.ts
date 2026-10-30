import { describe, expect, it } from "vitest";
import { isNavCurrent } from "./navCurrent";

// The app's bar: the wallet is the home of "/dashboard"; the demo's home is "/demo".
const APP_HOME = "/dashboard";
const DEMO_HOME = "/demo";

describe("isNavCurrent", () => {
  it("makes the wallet current on its own page only, not on the pages under it", () => {
    expect(isNavCurrent("/dashboard", APP_HOME, APP_HOME)).toBe(true);
    expect(isNavCurrent("/dashboard/movements", APP_HOME, APP_HOME)).toBe(false);
    expect(isNavCurrent("/dashboard/budgets", APP_HOME, APP_HOME)).toBe(false);
    expect(isNavCurrent("/dashboard/profile", APP_HOME, APP_HOME)).toBe(false);
    expect(isNavCurrent("/dashboard/icons-preview", APP_HOME, APP_HOME)).toBe(false);
  });

  it("makes a tab current on its own page and on the pages under it", () => {
    expect(isNavCurrent("/dashboard/budgets", "/dashboard/budgets", APP_HOME)).toBe(true);
    expect(isNavCurrent("/dashboard/budgets/abc", "/dashboard/budgets", APP_HOME)).toBe(true);
    expect(isNavCurrent("/dashboard/movements", "/dashboard/budgets", APP_HOME)).toBe(false);
  });

  it("does not match a tab whose name is only the start of another path", () => {
    expect(isNavCurrent("/dashboard/budgetsX", "/dashboard/budgets", APP_HOME)).toBe(false);
  });

  it("makes the demo's wallet current on /demo only, and the demo's tabs on their pages", () => {
    expect(isNavCurrent("/demo", DEMO_HOME, DEMO_HOME)).toBe(true);
    expect(isNavCurrent("/demo/movements", DEMO_HOME, DEMO_HOME)).toBe(false);
    expect(isNavCurrent("/demo/movements", "/demo/movements", DEMO_HOME)).toBe(true);
  });
});
