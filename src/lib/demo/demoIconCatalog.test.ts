import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fluentSlugFor } from "@/components/icons/fluentIcons";
import { resolveIcon } from "@/components/multiUsedComp/UniversalCategoIcon";
import {
  DEMO_CATEGORIES,
  DEMO_DEFAULT_CATEGORIES,
  DEMO_DEFAULT_SUBCATEGORIES,
  DEMO_PROJECT,
  DEMO_SUBCATEGORIES,
} from "./demoData";

describe("demo category icon fixtures", () => {
  it("use icons from Gastify's bundled catalog instead of text placeholders", () => {
    const icons = [
      ...DEMO_CATEGORIES,
      ...DEMO_DEFAULT_CATEGORIES,
      ...DEMO_SUBCATEGORIES,
      ...DEMO_DEFAULT_SUBCATEGORIES,
      DEMO_PROJECT,
    ];

    for (const item of icons) {
      const slug = fluentSlugFor(item.icon);
      if (slug) {
        expect(existsSync(join(process.cwd(), "public/icons/fluent", `${slug}.webp`)), `${item.name}: ${item.icon}`).toBe(true);
      } else {
        expect(resolveIcon(item.icon), `${item.name}: ${item.icon}`).not.toBeNull();
      }
    }
  });
});
