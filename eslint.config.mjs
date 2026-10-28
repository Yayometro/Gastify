import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// The app's lint rules: Next's Core Web Vitals and TypeScript rules. Next 16 removed `next lint`, so this is the ESLint CLI
// running the same rules over the same folder (src) that `next lint` checked before.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "apps/**", "packages/**", "coverage/**"]),
  {
    // The React Compiler rules are new in eslint-plugin-react-hooks 7. They flag patterns this app uses on purpose (reading the
    // device's storage after the first paint, a few refs and document cookies). They stay warnings until each spot is reworked.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
    },
  },
]);
