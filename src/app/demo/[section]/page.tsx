import { notFound } from "next/navigation";
import DemoPage, { DEMO_METADATA } from "../DemoPage";
import type { DemoSection } from "../DemoWorkspace";

export const metadata = DEMO_METADATA;

const sections = new Set<DemoSection>([
  "profile", "movements", "budgets", "projections", "analyzer", "accounts", "history", "categories", "goals", "opportunities",
]);

export default async function DemoSectionPage({ params }: { params: Promise<{ section: string }> }): Promise<React.JSX.Element> {
  const { section } = await params;
  if (!sections.has(section as DemoSection)) notFound();
  return <DemoPage section={section as DemoSection} />;
}
