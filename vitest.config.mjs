import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Lets the tests import .tsx components (the app's own build uses Next's SWC).
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Code shared with the mobile app (see packages/core/README.md).
      "@gastify/core": path.resolve(import.meta.dirname, "./packages/core/src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.test.js", "src/**/*.test.ts", "src/**/*.test.tsx",
      "packages/**/*.test.js", "packages/**/*.test.ts", "packages/**/*.test.tsx",
    ],
    exclude: ["**/node_modules/**"],
  },
});
