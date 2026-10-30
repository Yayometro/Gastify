"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Spin } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import { FLUENT_PREFIX } from "@/components/icons/fluentIcons";
import {
  loadFluentManifest,
  searchFluentIcons,
  type FluentManifestIcon,
} from "@/components/icons/fluentManifest";
import { useT } from "@/i18n/client";

export interface IconDisplayerMenuProps {
  // The icon chosen now, as "fluent/<slug>": it is highlighted in the grid.
  idmValue?: string;
  // Receives the chosen icon as "fluent/<slug>".
  idmIcon: (icon: string) => void;
  // Optional disclosure used in the public demo to make the size of Gastify's catalog explicit.
  showCatalogSummary?: boolean;
  // Optional larger initial sample for the public demo; regular forms default to two responsive rows.
  initialPageSize?: number;
}

// The icon picker loads the shared Fluent library on demand and shows two responsive rows initially. The user can expand
// the scrollable catalog or search it; the form remains the surrounding window.
function IconDisplayerMenu({ idmValue, idmIcon, showCatalogSummary = false, initialPageSize }: IconDisplayerMenuProps): React.JSX.Element {
  const t = useT();
  const [icons, setIcons] = useState<FluentManifestIcon[] | null>(null);
  const [failed, setFailed] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [showAll, setShowAll] = useState(false);
  const [columnCount, setColumnCount] = useState(5);
  const gridContainer = useRef<HTMLUListElement>(null);
  useEffect(() => {
    let cancelled = false;
    loadFluentManifest()
      .then((list) => {
        if (!cancelled) setIcons(list);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const element = gridContainer.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setColumnCount(Math.max(1, Math.floor((entry.contentRect.width + 8) / 64)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [icons]);

  const found = useMemo(() => (icons ? searchFluentIcons(icons, query) : []), [icons, query]);
  const collapsedLimit = Math.max(1, initialPageSize ?? columnCount * 2);
  const visibleLimit = showAll ? found.length : collapsedLimit;
  const matches = found.slice(0, visibleLimit);
  const collapsedHeight = initialPageSize === undefined ? 120 : Math.ceil(collapsedLimit / columnCount) * 64 - 8;

  return (
    <div className="flex w-full flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowAll(false);
        }}
        placeholder={t("navbar.icons.searchPlaceholder")}
        aria-label={t("navbar.icons.search")}
        className="w-full rounded-full border-2 border-purple-500 bg-transparent px-3 py-1"
      />
      {failed ? (
        <p className="text-sm text-red-300">{t("navbar.icons.loadError")}</p>
      ) : icons === null ? (
        <div className="flex justify-center py-6">
          <Spin />
        </div>
      ) : (
        <>
          {showCatalogSummary && (
            <p className="text-xs leading-relaxed text-gf-text-muted">
              {t("shared.demo.iconLibrarySummary", { p1: icons.length.toLocaleString() })}
            </p>
          )}
          <p className="text-xs text-gf-text-muted">{found.length === 1 ? t("web.1.icon") : t("web.icons.count", { p1: found.length })}</p>
          {matches.length === 0 ? (
            <p className="text-sm text-gf-text-muted">{t("navbar.icons.none")}</p>
          ) : (
            <ul
              ref={gridContainer}
              className={`m-0 grid w-full list-none gap-2 p-0 ${showAll ? "max-h-80 overflow-y-auto pr-1" : "overflow-hidden"}`}
              style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`, maxHeight: showAll ? 320 : collapsedHeight }}
            >
              {matches.map((icon) => {
                const name = `${FLUENT_PREFIX}${icon.slug}`;
                const selected = name === idmValue;
                return (
                  <li key={icon.slug}>
                    <button
                      type="button"
                      title={icon.name}
                      aria-label={icon.name}
                      aria-pressed={selected}
                      onClick={() => idmIcon(name)}
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors ${
                        selected ? "border-purple-500 bg-gf-accent-soft-bg" : "border-gf-border bg-gf-surface hover:border-purple-300"
                      }`}
                    >
                      <UniversalCategoIcon type={name} siz={34} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {found.length > collapsedLimit && (
            <button
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((shown) => !shown)}
              className="self-center py-2 text-sm font-semibold text-purple-300"
            >
              {showAll ? t("navbar.icons.less") : t("navbar.icons.more", { p1: found.length - collapsedLimit })}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default IconDisplayerMenu;
