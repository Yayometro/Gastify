import { I18nProvider } from "@/i18n/client";
import { currentLocale, messagesFor } from "@/i18n/server";
import { NAMESPACES } from "@gastify/core/i18n/catalogs";
import DemoNavigation from "@/components/demo/DemoNavigation";
import { TourProvider } from "@/components/tour/TourProvider";
import DemoNoticeBar from "@/components/demo/DemoNoticeBar";
import DemoWorkspace, { type DemoSection } from "./DemoWorkspace";
import "./demo.css";
import "./actual-dashboard.css";

export const DEMO_METADATA = {
  title: "Prueba Gastify con datos de ejemplo",
  description: "Explora Gastify con datos ficticios, sin crear una cuenta ni conectar información personal.",
  robots: { index: false as const, follow: false as const },
};

const DEMO_NAMESPACES = NAMESPACES.filter((namespace) => namespace !== "inicio" && namespace !== "mobile");

export default async function DemoPage({ section }: { section: DemoSection }): Promise<React.JSX.Element> {
  const locale = await currentLocale();
  const messages = await messagesFor(locale, DEMO_NAMESPACES);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <TourProvider>
        <div className="demo-app demo-actual-shell">
          <DemoNavigation />
          <div className="demo-main-column">
            <DemoNoticeBar />
            <DemoWorkspace section={section} />
          </div>
        </div>
      </TourProvider>
    </I18nProvider>
  );
}
