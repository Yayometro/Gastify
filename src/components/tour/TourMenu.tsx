"use client";

import React, { useEffect, useRef, useState } from "react";
import { IoCompassOutline, IoHelpCircleOutline, IoListOutline, IoNavigateOutline } from "react-icons/io5";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import { useT } from "@/i18n/client";
import { componentToursFor, type ComponentTourId, type TourPage } from "@gastify/core/tour/tourSteps";
import { firstAnchorShown } from "./tourDom";

interface TourMenuProps {
  // The page the person is on, when it has a tour of its own.
  page: TourPage | null;
  onClose: () => void;
  onPage: () => void;
  onBasics: () => void;
  onFull: () => void;
  // Starts the in-depth tutorial of one component of the page.
  onComponent: (id: ComponentTourId) => void;
}

function Option({ icon, title, hint, onClick, first }: { icon: React.ReactNode; title: string; hint: string; onClick: () => void; first?: React.Ref<HTMLButtonElement> }): React.JSX.Element {
  return (
    <button
      ref={first}
      type="button"
      onClick={onClick}
      className="gf-glass-card flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-500/20 text-purple-200" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block text-xs text-purple-100/70">{hint}</span>
      </span>
    </button>
  );
}

// The menu behind the Tutorial button: this page, how to move around, or the whole app.
export default function TourMenu({ page, onClose, onPage, onBasics, onFull, onComponent }: TourMenuProps): React.JSX.Element {
  const t = useT();
  // The page's component tutorials whose control is on screen now (the demo, for one, lacks some of the signed-in app's controls).
  const [components] = useState<ComponentTourId[]>(() => (page ? componentToursFor(page).filter((id) => firstAnchorShown(id)) : []));
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);

  // Focus goes into the menu when it opens and back to the button that opened it when it closes; Esc closes and Tab stays inside.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => firstRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled)"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [onClose]);

  return (
    <BasicModal
      zIndexClass="z-[10010]"
      close={onClose}
      renderContent={
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gf-tour-menu-title"
          className="content absolute z-[10011] flex w-[94vw] max-w-[440px] flex-col gap-4 overflow-hidden rounded-3xl p-6 gf-glass-violet"
        >
          <header className="flex items-start gap-3 pr-2">
            <IoHelpCircleOutline size={28} className="mt-0.5 shrink-0 text-purple-300" aria-hidden="true" />
            <div>
              <h2 id="gf-tour-menu-title" className="text-xl font-bold text-white">{t("tour.menu.title")}</h2>
              <p className="text-sm text-purple-100/75">{t("tour.menu.subtitle")}</p>
            </div>
          </header>
          <div className="flex flex-col gap-2.5">
            {page ? (
              <Option first={firstRef} icon={<IoListOutline size={20} />} title={t("tour.menu.page")} hint={t("tour.menu.pageHint")} onClick={onPage} />
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-purple-100/75">{t("tour.menu.noPage")}</p>
            )}
            <Option first={page ? undefined : firstRef} icon={<IoNavigateOutline size={20} />} title={t("tour.menu.basics")} hint={t("tour.menu.basicsHint")} onClick={onBasics} />
            <Option icon={<IoCompassOutline size={20} />} title={t("tour.menu.full")} hint={t("tour.menu.fullHint")} onClick={onFull} />
          </div>
          {components.length > 0 && (
            <section aria-labelledby="gf-tour-menu-components" className="flex min-h-0 flex-col gap-2">
              <h3 id="gf-tour-menu-components" className="text-sm font-bold text-white">{t("tour.menu.components")}</h3>
              <p className="-mt-1 text-xs text-purple-100/70">{t("tour.menu.componentsHint")}</p>
              <ul className="flex max-h-[34vh] flex-col gap-1.5 overflow-y-auto pr-1">
                {components.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => onComponent(id)}
                      className="gf-glass-card flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-purple-50 transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300"
                    >
                      <IoCompassOutline size={16} className="shrink-0 text-purple-300" aria-hidden="true" />
                      {t(`tour.${id}.name`)}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <button type="button" onClick={onClose} className="gf-glass-card self-end rounded-full px-5 py-2 text-sm font-semibold text-purple-100 hover:text-white">
            {t("tour.menu.close")}
          </button>
        </div>
      }
    />
  );
}
