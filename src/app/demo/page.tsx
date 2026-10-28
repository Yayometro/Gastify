import DemoPageShell, { DEMO_METADATA } from "./DemoPage";

export const metadata = DEMO_METADATA;

export default async function DemoPage() {
  return <DemoPageShell section="dashboard" />;
}
