import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Lets the tests import .tsx components (the app's own build uses Next's SWC).
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.js", "src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
