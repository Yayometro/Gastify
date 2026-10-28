"use client";

import React, { useRef } from "react";

// A control that says what it is: the hint appears on hover (and on keyboard focus), and a click opens a dialog with the full
// explanation. Every bar, row, cell and "?" of the admin panel uses it, so no number is left without its meaning.
export default function InfoButton({
  title,
  hint,
  body,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  body: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={hint ? `${title}. ${hint}` : title}
        className={`group relative cursor-pointer rounded-xl text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300 ${className}`}
      >
        {children}
        {hint && (
          <span
            role="tooltip"
            className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[18rem] -translate-x-1/2 rounded-xl border border-white/10 bg-[#1b1233] px-3 py-2 text-left text-xs font-semibold leading-snug text-white opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
          >
            {hint}
          </span>
        )}
      </button>
      <dialog
        ref={dialog}
        onClick={(event) => {
          // A click on the backdrop (outside the card) closes the dialog.
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(92vw,30rem)] rounded-[28px] border border-white/10 bg-[#1e1538] p-0 text-gf-text shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-4 p-6">
          <header className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-extrabold">{title}</h3>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="gf-glass-inset shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-purple-200 hover:text-white"
            >
              Cerrar
            </button>
          </header>
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-gf-text-muted">{body}</div>
        </div>
      </dialog>
    </>
  );
}
