"use client";

import React, { useEffect, useMemo, useState } from "react";
import UniversalCategoIcon from "./UniversalCategoIcon";
import CategoIcon from "./CategoIcon";
import { Spin, Tooltip } from "antd";
import { FLUENT_PREFIX } from "@/components/icons/fluentIcons";
import {
  groupFluentIcons,
  loadFluentManifest,
  searchFluentIcons,
  type FluentManifestIcon,
} from "@/components/icons/fluentManifest";

export interface IconDisplayerMenuProps {
  idmActive?: boolean;
  // Receives the chosen icon as "fluent/<slug>".
  idmIcon: (icon: string) => void;
  idmClose: (active: boolean) => void;
}

// Full-screen icon picker over the Fluent Emoji 3D library (1,285 icons): a search box
// (name or keywords, e.g. "gas", "pet", "coffee") and the library grouped by theme,
// starting with the "Suggested" ones.
function IconDisplayerMenu({ idmActive, idmIcon, idmClose }: IconDisplayerMenuProps): React.JSX.Element {
  const [active, setActive] = useState<boolean>(false);
  const [icons, setIcons] = useState<FluentManifestIcon[] | null>(null);
  const [failed, setFailed] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    if (idmActive) setActive(true);
  }, [idmActive]);

  // The list is fetched the first time the picker opens.
  useEffect(() => {
    if (!active || icons) return;
    let cancelled = false;
    loadFluentManifest()
      .then((list) => {
        if (!cancelled) {
          setIcons(list);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [active, icons]);

  const searching = query.trim().length > 0;
  const groups = useMemo(() => {
    if (!icons) return [];
    if (searching) return [{ name: "Results", icons: searchFluentIcons(icons, query) }];
    return groupFluentIcons(icons, true);
  }, [icons, query, searching]);

  const close = () => {
    setActive(false);
    setQuery("");
    idmClose(false);
  };

  const choose = (slug: string) => {
    idmIcon(`${FLUENT_PREFIX}${slug}`);
    close();
  };

  return (
    <div
      className={`fixed top-[-0%] right-[-0%] w-[100%] h-[100%] z-[1005] ${active ? "flex" : "hidden"} justify-center items-center bg-black/50 backdrop-blur-md`}
    >
      <div className=" w-[90%] h-[95%] gf-glass-violet pl-2 pr-4 py-4 relative rounded-2xl overflow-y-auto ">
        <button
          type="button"
          aria-label="Close"
          className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short cursor-pointer p-2"
          onClick={close}
        >
          <CategoIcon type={"MdClose"} siz={20} />
        </button>
        <div className="flex gap-2 justify-center items-center">
          <h2 className=" text-3xl font-semibold">All icons</h2>
          <Tooltip title="Search by name or keyword (food, car, pet, gym...) or scroll the library, then click the icon you want 🤓">
            <div className=" w-[15px]">
              <UniversalCategoIcon type={`${"fa/FaRegQuestionCircle"}`} siz={15} />
            </div>
          </Tooltip>
        </div>
        <div className="flex flex-col items-center pt-3 pb-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons..."
            aria-label="Search icons"
            className="w-full max-w-[420px] border-2 border-purple-500 px-3 py-1 rounded-full bg-transparent"
          />
        </div>
        {failed ? (
          <div className="w-full h-[60%] flex flex-col justify-center items-center gap-3">
            <p className="text-lg">Could not load the icons.</p>
            <button type="button" className="gf-glass-button text-white rounded-full px-4 py-2" onClick={() => setFailed(false)}>
              Try again
            </button>
          </div>
        ) : !icons ? (
          <div className="w-full h-[60%] flex justify-center items-center">
            <div className="flex flex-col justify-center items-center">
              <Spin size="large" />
              <p className=" text-lg">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {groups.every((g) => g.icons.length === 0) && <p className="text-center text-gf-text-muted pt-6">No icons match &quot;{query}&quot;.</p>}
            {groups
              .filter((group) => group.icons.length > 0)
              .map((group) => (
                <section className="w-full my-4 py-1 rounded-3xl" key={`icdm-group-${group.name}`}>
                  <h1 className="text-2xl pb-1 text-purple-300 text-center">
                    {group.name} <span className="text-sm text-gf-text-muted">({group.icons.length})</span>
                  </h1>
                  <ul className="flex flex-wrap justify-center items-center gap-2 pt-3 ">
                    {group.icons.map((icon) => (
                      <li key={`icdm-${group.name}-${icon.slug}`}>
                        <button
                          type="button"
                          title={icon.name}
                          aria-label={icon.name}
                          className="flex justify-center items-center cursor-pointer gf-hover-glass hover:rounded-2xl p-1"
                          onClick={() => choose(icon.slug)}
                        >
                          <UniversalCategoIcon type={`${FLUENT_PREFIX}${icon.slug}`} siz={45} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IconDisplayerMenu;
