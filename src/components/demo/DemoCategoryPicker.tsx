"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { IoChevronDown, IoClose, IoSearch } from "react-icons/io5";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { useT } from "@/i18n/client";

export interface DemoCategoryChoice {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentName?: string;
}

interface DemoCategoryPickerProps {
  label: string;
  placeholder: string;
  options: DemoCategoryChoice[];
  selectedId: string;
  onSelect: (choice: DemoCategoryChoice) => void;
  onModalOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
}

/** Searchable category chooser backed only by the demo's fixed local fixtures. */
export default function DemoCategoryPicker({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  onModalOpenChange,
  disabled = false,
}: DemoCategoryPickerProps): React.JSX.Element {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const selected = options.find((option) => option.id === selectedId);
  const filteredOptions = useMemo(() => {
    const term = normalizeSearch(query);
    if (!term) return options;
    return options.filter((option) => normalizeSearch(`${option.name} ${option.parentName || ""}`).includes(term));
  }, [options, query]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const focusReturnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current;
    previousFocusRef.current = focusReturnTarget;
    onModalOpenChange?.(true);
    const focusFrame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      cancelAnimationFrame(focusFrame);
      onModalOpenChange?.(false);
      focusReturnTarget?.focus();
    };
  }, [onModalOpenChange, open]);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      setOpen(false);
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    event.stopPropagation();
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='0']"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const modal = open && mounted ? createPortal(
    <div
      className="fixed inset-0 z-[13000] grid place-items-center bg-black/70 p-3 backdrop-blur-md sm:p-5"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="gf-glass-violet flex max-h-[min(680px,88dvh)] w-full max-w-[640px] flex-col overflow-hidden rounded-3xl border border-white/15 shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-purple-200">{t("shared.demo.categoryPicker.eyebrow")}</span>
            <h2 className="mt-1 text-lg font-semibold text-white">{label}</h2>
            <p className="mt-1 text-xs text-purple-100/65">{t("shared.demo.categoryPicker.help")}</p>
          </div>
          <button type="button" aria-label={t("shared.demo.categoryPicker.close")} onClick={() => setOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-purple-100 hover:bg-white/10 hover:text-white">
            <IoClose size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <label className="relative block">
            <span className="sr-only">{t("categories.search")}</span>
            <IoSearch size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-purple-100/55" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("categories.search")}
              className="w-full rounded-xl border border-white/10 bg-[#130d20]/75 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-purple-100/40 focus:border-purple-200/50"
            />
          </label>
          <p className="mb-3 mt-3 text-[11px] text-purple-100/60" aria-live="polite">
            {t("shared.demo.categoryPicker.count", { p1: filteredOptions.length })}
          </p>
          {filteredOptions.length ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="listbox" aria-label={label}>
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={selectedId === option.id}
                  onClick={() => { onSelect(option); setOpen(false); }}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${selectedId === option.id ? "border-purple-200/55 bg-purple-400/20 text-white" : "border-white/10 bg-black/15 text-purple-50 hover:border-purple-200/30 hover:bg-white/[.07]"}`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `${option.color}28`, color: option.color }}>
                    <UniversalCategoIcon type={option.icon} siz={23} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{option.name}</span>
                    {option.parentName && <span className="mt-0.5 block truncate text-[10px] text-purple-100/55">{option.parentName}</span>}
                  </span>
                  {selectedId === option.id && <span className="text-[10px] font-semibold text-purple-200">✓</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-black/15 px-4 py-8 text-center text-sm text-purple-100/65">{t("shared.demo.categoryPicker.empty")}</p>
          )}
        </div>
        <footer className="shrink-0 border-t border-white/10 px-4 py-3 text-[10px] text-purple-100/50 sm:px-5">
          {t("shared.demo.categoryPicker.localNote")}
        </footer>
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setQuery(""); setOpen(true); }}
        className={`flex min-h-[42px] w-full min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-[#130d20]/70 px-3 py-2.5 text-left text-sm text-white outline-none transition hover:border-purple-200/35 focus:border-purple-200/50 disabled:cursor-not-allowed disabled:opacity-45`}
      >
        {selected ? (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `${selected.color}28`, color: selected.color }}>
            <UniversalCategoIcon type={selected.icon} siz={17} />
          </span>
        ) : <span className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-white/5" aria-hidden="true" />}
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-white" : "text-purple-100/45"}`}>{selected?.name || placeholder}</span>
        <IoChevronDown size={16} className="shrink-0 text-purple-100/60" aria-hidden="true" />
      </button>
      {modal}
    </>
  );
}
