"use client";

import React, { useEffect, useMemo, useState } from "react";
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
}

// The icon picker of the form, as in the app: the whole Fluent Emoji library (1,285 icons) shown in place, with a search
// box (Spanish or English, e.g. "comida", "casa", "avión") and a page at a time with "Mostrar más". The list loads the
// first time the picker appears. No window of its own: the form it sits in is the window.
const PAGE = 60;

function IconDisplayerMenu({ idmValue, idmIcon }: IconDisplayerMenuProps): React.JSX.Element {
  const t = useT();
  const [icons, setIcons] = useState<FluentManifestIcon[] | null>(null);
  const [failed, setFailed] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [limit, setLimit] = useState<number>(PAGE);

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

  const found = useMemo(() => (icons ? searchFluentIcons(icons, query) : []), [icons, query]);
  const matches = found.slice(0, limit);

  return (
    <div className="flex w-full flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setLimit(PAGE);
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
          <p className="text-xs text-gf-text-muted">{found.length === 1 ? "1 ícono" : `${found.length} íconos`}</p>
          {matches.length === 0 ? (
            <p className="text-sm text-gf-text-muted">{t("navbar.icons.none")}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
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
          {found.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((current) => current + 120)}
              className="self-center py-2 text-sm font-semibold text-purple-300"
            >
              {t("navbar.icons.more", { p1: found.length - limit })}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default IconDisplayerMenu;
