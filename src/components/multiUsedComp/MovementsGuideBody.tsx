"use client";

import React from "react";
import { useT, useInfo } from "@/i18n/client";

// One desplegable: closed until the person taps its title.
function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <details className="group rounded-2xl border border-white/15 bg-black/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-bold text-white [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-purple-300 transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4 text-sm leading-relaxed text-purple-100/85">{children}</div>
    </details>
  );
}

// One control of a layer: its name in bold, then what it does and how to use it.
function Control({ name, children }: { name: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="font-semibold text-white">{name}</p>
      <div className="mt-1 flex flex-col gap-1">{children}</div>
    </div>
  );
}

// A layer of the screen, from the top down. Its controls are listed in the order the person meets them.
function Layer({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-purple-300">{title}</p>
      {children}
    </div>
  );
}

// The guide of the movements list. It is the body of the "?" of "Detalle de movimientos", so its window is the
// same as every other explanation, and its desplegables are kept as they were.
export function MovementsGuideBody(): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const t = useT();
  return (
    <div className="flex flex-col gap-3 pt-1">
      <p className="text-sm leading-relaxed text-purple-100/85">{t("movements.guide.intro")}</p>

      <Section title={t("movements.guide.what")}>
        <p>
          {t("movements.guide.whatText")}
        </p>
      </Section>

      <Section title={t("movements.guide.purpose")}>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>{t("movements.guide.purpose1")}</li>
          <li>{t("movements.guide.purpose2")}</li>
          <li>{t("movements.guide.purpose3")}</li>
          <li>{t("movements.guide.purpose4")}</li>
        </ul>
      </Section>

      <Section title={t("movements.guide.howTo")}>
        <ol className="flex list-decimal flex-col gap-1 pl-5">
          <li>{t("movements.guide.step1")}</li>
          <li>{t("movements.guide.step2")}</li>
          <li>{t("movements.guide.step3")}</li>
          <li>{t("movements.guide.step4")}</li>
          <li>{t("movements.guide.step5")}</li>
          <li>{t("movements.guide.step6")}</li>
        </ol>
      </Section>

      <Section title={t("movements.guide.filters")}>
        <p>{APP_INFO.filtros.text}</p>

        <Layer title={t("movements.guide.layer1")}>
          <Control name="Transactions details y el signo ?">
            <p>{t("movements.guide.layer1Help")}</p>
          </Control>
          <Control name="From / to">
            <p>{t("movements.guide.layer1Period")}</p>
          </Control>
        </Layer>

        <Layer title={t("movements.guide.layer2")}>
          <Control name="Select ON / OFF">
            <p>
              {t("movements.guide.select")}
            </p>
          </Control>
          <Control name="Periodo predefinido (menú)">
            <p>{t("movements.guide.preset")}</p>
          </Control>
          <Control name="Rango personalizado (selector de fechas)">
            <p>{t("movements.guide.custom")}</p>
          </Control>
          <Control name="Tipo: All transactions / All incomes / All bills">
            <p>{t("movements.guide.type")}</p>
          </Control>
          <Control name="Legibilidad: All / Readable / Not readable">
            <p>
              {t("movements.guide.readable")}
            </p>
          </Control>
          <Control name="Monto exacto (Primary / Native + campo)">
            <p>
              {t("movements.guide.amount")}
            </p>
          </Control>
          <Control name="Categoría o subcategoría (botón con el nombre)">
            <p>{t("movements.guide.category")}</p>
          </Control>
          <Control name={t("web.find.duplicates")}>
            <p>
              {t("movements.guide.duplicates")}
            </p>
          </Control>
          <Control name="Export data">
            <p>{t("movements.guide.export")}</p>
          </Control>
          <Control name="Clear filters">
            <p>{t("movements.guide.clear")}</p>
          </Control>
        </Layer>

        <Layer title={t("movements.guide.layer3")}>
          <Control name="Search by name, category, subcategory or tag">
            <p>{t("movements.guide.search")}</p>
          </Control>
        </Layer>

        <Layer title={t("movements.guide.layer4")}>
          <Control name="Cada fila">
            <p>{t("movements.guide.row")}</p>
          </Control>
        </Layer>
      </Section>
    </div>
  );
}
