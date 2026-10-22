"use client";

import React, { useState } from "react";
import { IoHelpCircleOutline } from "react-icons/io5";
import type { InfoText } from "@gastify/core/info/createInfo";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import CategoIcon from "./CategoIcon";
import { InfoContent } from "./InfoContent";

// The window of an explanation: its title, the formatted text and the buttons to close it.
export function InfoWindow({ info, onClose }: { info: InfoText; onClose: () => void }): React.JSX.Element {
  return (
    <BasicModal
      zIndexClass="z-[10010]"
      close={onClose}
      renderContent={
        <div className="content absolute gf-glass-violet flex flex-col w-[94vw] max-w-[580px] max-h-[88vh] rounded-3xl overflow-hidden z-[10011]">
          <div className="flex items-center gap-3 px-6 pt-6 pb-3 pr-14">
            <IoHelpCircleOutline size={26} className="shrink-0 text-purple-300" />
            <h2 className="flex-1 text-xl font-bold text-white">{info.title}</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <InfoContent text={info.text} sections={info.sections} />
          </div>
          <div className="px-6 pb-6 pt-2">
            <button type="button" onClick={onClose} className="w-full rounded-full p-2 font-semibold text-white gf-glass-button">
              Entendido
            </button>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute top-4 right-4 rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors">
            <CategoIcon type={"MdClose"} siz={18} />
          </button>
        </div>
      }
    />
  );
}

// The "?" that explains a window or a section: the same explanation the app shows, in a window of its own.
// It may sit inside a card that opens something when pressed: the tip and its window never reach that card.
export function InfoTip({ info, className = "" }: { info: InfoText; className?: string }): React.JSX.Element {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <>
      <button
        type="button"
        aria-label={`Qué es ${info.title}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center justify-center rounded-full text-purple-200 hover:text-white transition-colors ${className}`}
      >
        <IoHelpCircleOutline size={20} />
      </button>
      {open && (
        <span onClick={(event) => event.stopPropagation()}>
          <InfoWindow info={info} onClose={() => setOpen(false)} />
        </span>
      )}
    </>
  );
}
