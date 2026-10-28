"use client";

import Link from "next/link";
import type { JSX } from "react";
import LanguageSwitch from "@/i18n/LanguageSwitch";
import { useT } from "@/i18n/client";

export default function DemoNoticeBar(): JSX.Element {
  const t = useT();

  return (
    <div className="demo-notice-bar" role="note" style={{ borderBottomColor: "rgba(251, 113, 133, .32)", background: "rgba(66, 20, 39, .9)", color: "#ffe4e6" }}>
      <span className="demo-notice-message"><span className="demo-notice-dot" style={{ background: "#fda4af", boxShadow: "0 0 12px rgba(251, 113, 133, .75)" }} />{t("shared.demo.notice")}</span>
      <div className="demo-notice-actions">
        <span className="demo-notice-secondary" style={{ color: "#fda4af" }}>{t("shared.demo.localOnly")}</span>
        <LanguageSwitch className="demo-language-switch" />
        <Link href="/register" style={{ color: "#fecdd3" }}>{t("shared.demo.createAccount")} <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
