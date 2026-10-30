"use client";

import React from "react";
import type { InfoBlock, InfoSection } from "@gastify/core/info/createInfo";
import { useT } from "@/i18n/client";

// The formatted explanation of a "?": the same layout the app uses (labelled sections, tables, equations in little
// boxes, definitions, bullet lists and an example box). Colour words in the text (verde, rojo, ▲…) take their colour.
const WORD_COLORS: Record<string, string> = {
  verde: "text-emerald-300",
  rojo: "text-rose-300",
  naranja: "text-amber-300",
  azul: "text-sky-300",
  "▲": "text-emerald-300",
  "▼": "text-rose-300",
  "▬": "text-amber-300",
};

function Rich({ text, muted = true, className = "" }: { text: string; muted?: boolean; className?: string }) {
  const parts = text.split(/(\bverde\b|\brojo\b|\bnaranja\b|\bazul\b|[▲▼▬])/gi);
  return (
    <span className={`${muted ? "text-purple-100/85" : "text-gf-text"} ${className}`}>
      {parts.map((part, index) => {
        const color = WORD_COLORS[part.toLowerCase()];
        return color ? (
          <strong key={index} className={`font-bold ${color}`}>
            {part}
          </strong>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </span>
  );
}

function Box({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-xl px-3 py-1.5 text-sm ${strong ? "bg-purple-500/35 border border-purple-200/45 font-semibold text-gf-text" : "bg-white/10 border border-white/15 font-medium text-gf-text"}`}
    >
      {children}
    </span>
  );
}

function Equation({ left, right }: { left: string; right: string }) {
  // right = "a ÷ b" → [a, ÷, b]
  const pieces = right.split(/\s([÷×−+])\s/);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Box strong>{left}</Box>
      <span className="text-lg font-bold text-gf-text">=</span>
      {pieces.map((piece, index) =>
        index % 2 === 1 ? (
          <span key={index} className="text-lg font-bold text-gf-text">
            {piece}
          </span>
        ) : (
          <Box key={index}>{piece.replace(/^\(|\)$/g, "")}</Box>
        )
      )}
    </div>
  );
}

function Table({ head, rows }: { head?: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/15">
      <table className="w-full text-sm">
        {head && (
          <thead className="bg-purple-500/25">
            <tr>
              {head.map((cell, index) => (
                <th key={index} className="px-3 py-2 text-left text-xs font-semibold uppercase text-gf-text">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-black/20" : "bg-white/5"}>
              {row.map((cell, index) => (
                <td key={index} className={`px-3 py-2 align-top ${index === 0 ? "w-32 font-semibold text-gf-text" : ""}`}>
                  <Rich text={cell} muted={index !== 0} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ block }: { block: InfoBlock }) {
  const t = useT();
  switch (block.kind) {
    case "p":
      return <p className="text-sm leading-relaxed"><Rich text={block.text} /></p>;
    case "bullets":
      return (
        <ul className="flex flex-col gap-2">
          {block.items.map((item, index) => (
            <li key={index} className="flex gap-2 text-sm">
              <span className="font-bold text-purple-300">•</span>
              <Rich text={item} />
            </li>
          ))}
        </ul>
      );
    case "equation":
      return <Equation left={block.left} right={block.right} />;
    case "definition":
      return (
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-gf-text">{block.term}</p>
          <p className="text-sm"><Rich text={block.text} /></p>
        </div>
      );
    case "table":
      return <Table head={block.head} rows={block.rows} />;
    case "legend":
      return (
        <div className="flex flex-col gap-2">
          {block.items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="w-20 text-sm font-semibold text-gf-text">{item.label}</span>
              <span className="flex-1 text-sm"><Rich text={item.text} /></span>
            </div>
          ))}
        </div>
      );
    case "example":
      return (
        <div className="rounded-xl border border-white/15 bg-white/10 p-3">
          <p className="text-xs font-semibold uppercase text-purple-200">{t("shared.example")}</p>
          <p className="text-sm"><Rich text={block.text} muted={false} /></p>
        </div>
      );
  }
}

export function InfoContent({ text, sections }: { text: string; sections?: InfoSection[] }) {
  if (!sections || sections.length === 0) return <p className="text-sm leading-relaxed"><Rich text={text} /></p>;
  return (
    <div className="flex flex-col gap-5">
      {sections.map((section, index) => (
        <div key={`${section.label ?? "section"}-${index}`} className="flex flex-col gap-3">
          {section.label && (
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-purple-300" />
              <span className="text-xs font-bold uppercase tracking-wide text-purple-300">{section.label}</span>
            </div>
          )}
          {section.blocks.map((block, blockIndex) => (
            <Block key={blockIndex} block={block} />
          ))}
        </div>
      ))}
    </div>
  );
}
