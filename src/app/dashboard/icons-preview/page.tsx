import { notFound } from "next/navigation";
import IconsPreviewClient from "@/components/icons/IconsPreviewClient";

export const dynamic = "force-dynamic";

// Development-only page: old icon next to the Fluent emoji it turns into, to review
// the equivalence table (src/components/icons/iconLegacyMap.ts). 404 in production.
export default function IconsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <IconsPreviewClient />;
}
