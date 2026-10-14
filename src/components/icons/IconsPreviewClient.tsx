"use client";

import React, { useMemo, useState } from "react";
import { LEGACY_ICONS } from "./legacyIconRegistry";
import { LEGACY_TO_FLUENT } from "./iconLegacyMap";
import { fluentIconUrl } from "./fluentIcons";
import { defaultIcons } from "@/helpers/defaultIconsDB";

const BRANDS = ["fa/FaGoogle", "fa/FaAmazon", "fa/FaApple", "fa/FaCcApplePay", "fa/FaLinkedin", "fa/FaYoutube", "fa/FaAirbnb", "fa/FaXbox", "fa/FaSteam", "fa/FaGithub"];

function Row({ legacy, slug }: { legacy: string; slug?: string }) {
  const Old = LEGACY_ICONS[legacy];
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs">
      <span className="w-10 flex justify-center text-white">{Old ? <Old size={32} /> : "?"}</span>
      <span className="text-gf-text-muted">→</span>
      <span className="w-12 flex justify-center">
        {slug ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fluentIconUrl(slug)} alt="" width={44} height={44} />
        ) : (
          <span className="text-[10px] text-gf-text-muted text-center">sin cambio</span>
        )}
      </span>
      <span className="flex flex-col min-w-0">
        <code className="truncate">{legacy}</code>
        <code className="truncate text-purple-300">{slug ? `fluent/${slug}` : "se queda como vector"}</code>
      </span>
    </div>
  );
}

// Dev-only review page for the old -> Fluent equivalence table.
export default function IconsPreviewClient(): React.JSX.Element {
  const [filter, setFilter] = useState("");
  const sections = useMemo(() => {
    const seen = new Set<string>();
    const result: { title: string; names: string[] }[] = defaultIcons.map((g) => ({
      title: g.name,
      names: g.icons.filter((n) => (seen.has(n) ? false : (seen.add(n), true))),
    }));
    const extra = Object.keys(LEGACY_TO_FLUENT).filter((n) => !seen.has(n));
    result.push({ title: "Solo en tus datos / valores por defecto (no están en el selector antiguo)", names: extra });
    result.push({ title: "Logos de marcas: no existen como emoji, se quedan igual", names: BRANDS });
    return result;
  }, []);
  const needle = filter.trim().toLowerCase();

  return (
    <div className="w-full p-6 md:pl-[100px]">
      <h1 className="text-3xl font-semibold text-center">Equivalencias de íconos (solo desarrollo)</h1>
      <p className="text-center text-sm text-gf-text-muted pt-2">
        Izquierda: el ícono de hoy. Derecha: el emoji Fluent 3D con el que se dibujará. {Object.keys(LEGACY_TO_FLUENT).length} equivalencias.
      </p>
      <div className="flex justify-center py-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar (nombre viejo o nuevo)..."
          className="w-full max-w-[420px] border-2 border-purple-500 px-3 py-1 rounded-full bg-transparent"
        />
      </div>
      {sections.map((section) => {
        const names = section.names.filter((n) => !needle || n.toLowerCase().includes(needle) || (LEGACY_TO_FLUENT[n] || "").includes(needle));
        if (names.length === 0) return null;
        return (
          <section key={section.title} className="pb-6">
            <h2 className="text-xl text-purple-300 pb-2">
              {section.title} <span className="text-sm text-gf-text-muted">({names.length})</span>
            </h2>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {names.map((n) => (
                <Row key={`${section.title}-${n}`} legacy={n} slug={LEGACY_TO_FLUENT[n]} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
