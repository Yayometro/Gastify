import type { TranslateFn } from "@gastify/core/i18n/translate";
import type { ReactNode } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useT } from "@/i18n/client";

// What a "?" sheet shows. A tooltip can bring hand-made `sections` (with tables, equations and legends) or just a `text`,
// which is laid out by `autoSections`: the sentences are told apart into what the section shows, how it is calculated
// (equations in little boxes), how to read it (colors and arrows highlighted) and how to use it.
export type InfoBlock =
  | { kind: 'p'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'equation'; left: string; right: string }
  | { kind: 'definition'; term: string; text: string }
  | { kind: 'table'; head?: string[]; rows: string[][] }
  | { kind: 'legend'; items: { color: string; label: string; text: string }[] }
  | { kind: 'example'; text: string };
export type InfoSection = { label?: string; blocks: InfoBlock[] };

const GREEN = '#34d399';
const RED = '#fb7185';
const ORANGE = '#f59e0b';
const BLUE = '#60a5fa';

const WORD_COLORS: Record<string, string> = { verde: GREEN, rojo: RED, naranja: ORANGE, azul: BLUE, '▲': GREEN, '▼': RED, '▬': ORANGE };
const OPERATOR = /\s([÷×−+])\s/;
const ACTION_START = /^(Toca|Toque|Abre|Abrir|Elige|Usa|Desliza|Arrastra|Pulsa|Cambia|Activa|Con «)/;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ«¿¡0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// A clause "A = B" becomes an equation when B has an operator and is short, and a definition ("A: B") otherwise.
function toEquationOrDefinition(clause: string): InfoBlock | null {
  const match = /^(.{2,60}?) = (.+?)\.?$/.exec(clause);
  if (!match) return null;
  const [, left, right] = match;
  if (OPERATOR.test(right) && right.length < 90) return { kind: 'equation', left, right };
  return { kind: 'definition', term: left, text: right.charAt(0).toUpperCase() + right.slice(1) };
}

export function autoSections(t: TranslateFn, text: string): InfoSection[] {
  const about: InfoBlock[] = [];
  const calc: InfoBlock[] = [];
  const read: InfoBlock[] = [];
  const use: string[] = [];
  let sawFormula = false;

  for (const paragraph of text.split(/\n\n+/)) {
    for (const sentence of splitSentences(paragraph)) {
      if (ACTION_START.test(sentence)) {
        use.push(sentence);
        continue;
      }
      const clauses = sentence.includes(' = ') ? sentence.split(/;\s+/) : [sentence];
      const blocks = clauses.map((clause) => (clause.includes(' = ') ? toEquationOrDefinition(clause) : null));
      if (blocks.every(Boolean)) {
        sawFormula = true;
        calc.push(...(blocks as InfoBlock[]));
        continue;
      }
      if (/\b(verde|rojo|naranja)\b|[▲▼▬]/i.test(sentence)) {
        read.push({ kind: 'p', text: sentence });
        continue;
      }
      (sawFormula ? calc : about).push({ kind: 'p', text: sentence });
    }
  }

  const sections: InfoSection[] = [];
  if (about.length) sections.push({ label: t("mobile.que.muestra"), blocks: about.length > 2 ? [{ kind: 'bullets', items: about.map((block) => (block as { text: string }).text) }] : about });
  if (calc.length) sections.push({ label: t("mobile.como.se.calcula"), blocks: calc });
  if (read.length) sections.push({ label: t("mobile.como.leerlo"), blocks: read });
  if (use.length) sections.push({ label: t("mobile.como.usarlo"), blocks: [{ kind: 'bullets', items: use }] });
  return sections;
}

// Text in which the color words and the arrows are drawn in their color, so «verde» reads green.
function Rich({ text, size = 'text-base', muted = true }: { text: string; size?: string; muted?: boolean }) {
  const parts = text.split(/(\bverde\b|\brojo\b|\bnaranja\b|\bazul\b|[▲▼▬])/gi);
  return (
    <Text className={`font-inter ${size} ${muted ? 'text-gf-text-muted' : 'text-gf-text'}`}>
      {parts.map((part, index) => {
        const color = WORD_COLORS[part.toLowerCase()];
        return color ? <Text key={index} className="font-inter-bold" style={{ color }}>{part}</Text> : part;
      })}
    </Text>
  );
}

function Box({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  const dark = useColorScheme() === 'dark';
  return (
    <View className="rounded-xl px-3 py-1.5" style={{ backgroundColor: strong ? 'rgba(168,85,247,0.30)' : dark ? 'rgba(255,255,255,0.10)' : 'rgba(27,16,61,0.07)', borderWidth: 1, borderColor: strong ? 'rgba(233,213,255,0.45)' : dark ? 'rgba(255,255,255,0.14)' : 'rgba(27,16,61,0.10)' }}>
      {children}
    </View>
  );
}

function Equation({ left, right }: { left: string; right: string }) {
  // right = "a ÷ b" → [a, ÷, b]
  const pieces = right.split(/\s([÷×−+])\s/);
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Box strong><Text className="font-inter-semibold text-sm text-gf-text">{left}</Text></Box>
      <Text className="font-inter-bold text-lg text-gf-text">=</Text>
      {pieces.map((piece, index) =>
        index % 2 === 1 ? (
          <Text key={index} className="font-inter-bold text-lg text-gf-text">{piece}</Text>
        ) : (
          <Box key={index}><Text className="font-inter-medium text-sm text-gf-text">{piece.replace(/^\(|\)$/g, '')}</Text></Box>
        )
      )}
    </View>
  );
}

function Table({ head, rows }: { head?: string[]; rows: string[][] }) {
  const dark = useColorScheme() === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  return (
    <View className="overflow-hidden rounded-xl" style={{ borderWidth: 1, borderColor: colors.border }}>
      {head && (
        <View className="flex-row gap-3 px-3 py-2" style={{ backgroundColor: dark ? 'rgba(168,85,247,0.28)' : 'rgba(168,85,247,0.14)' }}>
          {head.map((cell, index) => <Text key={index} className={`font-inter-semibold text-xs uppercase text-gf-text ${index === 0 ? 'w-28' : 'flex-1'}`}>{cell}</Text>)}
        </View>
      )}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-3 px-3 py-2.5" style={{ backgroundColor: rowIndex % 2 === 0 ? (dark ? 'rgba(0,0,0,0.18)' : 'rgba(27,16,61,0.05)') : (dark ? 'rgba(255,255,255,0.07)' : 'transparent') }}>
          {row.map((cell, index) => (
            <View key={index} className={index === 0 ? 'w-28' : 'flex-1'}>
              <Rich text={cell} size="text-sm" muted={index !== 0} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Block({ block }: { block: InfoBlock }) {
  const t = useT();
  switch (block.kind) {
    case 'p':
      return <Rich text={block.text} />;
    case 'bullets':
      return (
        <View className="gap-2.5">
          {block.items.map((item, index) => (
            <View key={index} className="flex-row gap-2.5">
              <Text className="font-inter-bold text-base" style={{ color: '#c084fc' }}>•</Text>
              <View className="flex-1"><Rich text={item} /></View>
            </View>
          ))}
        </View>
      );
    case 'equation':
      return <Equation left={block.left} right={block.right} />;
    case 'definition':
      return (
        <View className="gap-0.5">
          <Text className="font-inter-semibold text-base text-gf-text">{block.term}</Text>
          <Rich text={block.text} />
        </View>
      );
    case 'table':
      return <Table head={block.head} rows={block.rows} />;
    case 'legend':
      return (
        <View className="gap-2">
          {block.items.map((item) => (
            <View key={item.label} className="flex-row items-center gap-3">
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color }} />
              <Text className="w-20 font-inter-semibold text-sm text-gf-text">{item.label}</Text>
              <View className="flex-1"><Rich text={item.text} size="text-sm" /></View>
            </View>
          ))}
        </View>
      );
    case 'example':
      return (
        <Box>
          <Text className="font-inter-semibold text-xs uppercase text-gf-text-muted">{t("mobile.ejemplo")}</Text>
          <Rich text={block.text} size="text-sm" muted={false} />
        </Box>
      );
  }
}

export function InfoContent({ text, sections }: { text: string; sections?: InfoSection[] }) {
  const t = useT();
  const laid = sections ?? autoSections(t, text);
  if (laid.length === 0) return <Rich text={text} />;
  return (
    <View className="gap-5">
      {laid.map((section, index) => (
        <View key={`${section.label ?? 'section'}-${index}`} className="gap-3">
          {section.label ? (
            <View className="flex-row items-center gap-2">
              <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#c084fc' }} />
              <Text className="font-inter-bold text-xs uppercase tracking-wide" style={{ color: '#c084fc' }}>{section.label}</Text>
            </View>
          ) : null}
          {section.blocks.map((block, blockIndex) => <Block key={blockIndex} block={block} />)}
        </View>
      ))}
    </View>
  );
}
