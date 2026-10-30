"use client";

import React, { useState } from "react";
import { CATEGORY_COLORS } from "@gastify/core/categories/categoryForm";
import { COLOR_GRID, normalizeHex } from "@gastify/core/colors/palette";
import { useT } from "@/i18n/client";

const CLASSIC_COLOR_SET = new Set<string>(CATEGORY_COLORS.map((color) => color.toUpperCase()));
const ADDITIONAL_COLORS = COLOR_GRID.filter((color) => !CLASSIC_COLOR_SET.has(color.toUpperCase()));

export interface CategoryColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// The color of a category, as in the app's form: the usual colors first, then a wide grid, then a field for any
// hexadecimal color. The chosen one has a ring; the preview shows the color the field holds.
function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps): React.JSX.Element {
  const t = useT();
  const [hexDraft, setHexDraft] = useState({ source: value, draft: value });
  const [showAllColors, setShowAllColors] = useState(false);
  const hex = hexDraft.source === value ? hexDraft.draft : value;
  const valid = normalizeHex(hex);

  const pick = (color: string) => {
    setHexDraft({ source: value, draft: color });
    onChange(color);
  };

  const swatch = (color: string, size: number) => {
    const selected = color.toUpperCase() === value.toUpperCase();
    return (
      <button
        key={color}
        type="button"
        aria-label={t("categories.colorLabel", { p1: color })}
        aria-pressed={selected}
        title={color}
        onClick={() => pick(color)}
        className="flex shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110"
        style={{ width: size + 8, height: size + 8, border: `3px solid ${selected ? "#9700FF" : "transparent"}` }}
      >
        <span className="block rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
      </button>
    );
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <p className="label-tfp">{t("categories.colors.classic")}</p>
        <div className="flex flex-wrap gap-1">{CATEGORY_COLORS.map((color) => swatch(color, 34))}</div>
      </div>
      <button
        type="button"
        aria-expanded={showAllColors}
        onClick={() => setShowAllColors((shown) => !shown)}
        className="self-start text-sm font-semibold text-purple-300 hover:text-white"
      >
        {showAllColors ? t("categories.colors.less") : t("categories.colors.more")}
        {!showAllColors && <span className="ml-1 text-gf-text-muted">({ADDITIONAL_COLORS.length})</span>}
      </button>
      {showAllColors && (
        <div className="flex flex-col gap-1.5">
          <p className="label-tfp">{t("categories.colors.more")}</p>
          <div className="max-h-48 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-1">{ADDITIONAL_COLORS.map((color) => swatch(color, 26))}</div>
          </div>
        </div>
      )}
      <div className="flex items-end gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="label-tfp">{t("categories.colors.hex")}</span>
          <input
            type="text"
            value={hex}
            maxLength={7}
            placeholder="#F57C00"
            onChange={(e) => {
              setHexDraft({ source: value, draft: e.target.value });
              const normalized = normalizeHex(e.target.value);
              if (normalized) onChange(normalized);
            }}
            className="h-12 w-full rounded-3xl gf-glass-inset px-3 text-gf-text"
          />
        </label>
        <span className="h-12 w-12 shrink-0 rounded-full border border-gf-border" style={{ backgroundColor: valid ?? value }} />
      </div>
      {hex.trim() !== "" && !valid && <p className="text-xs text-red-300">{t("categories.colors.hexHelp")}</p>}
    </div>
  );
}

export default CategoryColorPicker;
