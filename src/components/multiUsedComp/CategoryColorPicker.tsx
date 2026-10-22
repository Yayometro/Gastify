"use client";

import React, { useEffect, useState } from "react";
import { CATEGORY_COLORS } from "@gastify/core/categories/categoryForm";
import { COLOR_GRID, normalizeHex } from "@gastify/core/colors/palette";

export interface CategoryColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// The color of a category, as in the app's form: the usual colors first, then a wide grid, then a field for any
// hexadecimal color. The chosen one has a ring; the preview shows the color the field holds.
function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps): React.JSX.Element {
  const [hex, setHex] = useState<string>(value);
  const valid = normalizeHex(hex);

  // The form can change the color from outside (when a category loads): the field follows it.
  useEffect(() => {
    setHex(value);
  }, [value]);

  const pick = (color: string) => {
    setHex(color);
    onChange(color);
  };

  const swatch = (color: string, size: number) => {
    const selected = color.toUpperCase() === value.toUpperCase();
    return (
      <button
        key={color}
        type="button"
        aria-label={`Color ${color}`}
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
        <p className="label-tfp">Los de siempre</p>
        <div className="flex flex-wrap gap-1">{CATEGORY_COLORS.map((color) => swatch(color, 34))}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="label-tfp">Más colores</p>
        <div className="flex flex-wrap gap-1">{COLOR_GRID.map((color) => swatch(color, 26))}</div>
      </div>
      <div className="flex items-end gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="label-tfp">Color exacto (hexadecimal)</span>
          <input
            type="text"
            value={hex}
            maxLength={7}
            placeholder="#F57C00"
            onChange={(e) => {
              setHex(e.target.value);
              const normalized = normalizeHex(e.target.value);
              if (normalized) onChange(normalized);
            }}
            className="h-12 w-full rounded-3xl gf-glass-inset px-3 text-gf-text"
          />
        </label>
        <span className="h-12 w-12 shrink-0 rounded-full border border-gf-border" style={{ backgroundColor: valid ?? value }} />
      </div>
      {hex.trim() !== "" && !valid && <p className="text-xs text-red-300">Usa un color como #F57C00 o F57C00.</p>}
    </div>
  );
}

export default CategoryColorPicker;
