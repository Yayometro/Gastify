"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import type { BreakdownSlice } from "@gastify/core/history/categoryBreakdown";
import {
  BIG_TILE_MIN_H,
  BIG_TILE_MIN_W,
  NOMINAL_H,
  NOMINAL_W,
  TreemapTile,
  squarify,
  type TreemapNode,
  type TreemapNodeKind,
} from "./CategoryTreemap";

// The three charts of the card's "Resumen de transacciones", driven the way the phone's are. Each one draws only the level the
// card's path has opened (`slices`, as drillView gives them). A tap reports the key of the slice tapped through `onSelect`; a
// tap on the centre goes back up through `onBack`. The card owns the path, so the list and the chart always agree.

export interface BreakdownChartProps {
  // The slices of the current level: categories, the subcategories of one category, or the movements of one subcategory.
  slices: BreakdownSlice[];
  // The total of what is shown (the opened slice's value, or the whole period).
  total: number;
  // 0 at the top, 1 inside a category, 2 inside a subcategory.
  level: number;
  // The opened slice's name, or Gastos / Ingresos at the top.
  title: string;
  currency: string;
  onSelect: (key: string) => void;
  onBack: () => void;
}

// The root the rings and the bubbles hang from. It is the centre, not a slice: tapping it goes back up.
const ROOT_ID = "__breakdown_root__";
const ROOT_COLOR = "#6b21a8";

interface RingNode {
  id: string;
  name: string;
  color: string;
  value?: number;
  children?: RingNode[];
}

// Parents take the sum of their children, so only the leaves carry a value of their own.
function toRingNode(slice: BreakdownSlice): RingNode {
  const isLeaf = slice.children.length === 0;
  return {
    id: slice.key,
    name: slice.name,
    color: slice.color,
    value: isLeaf ? slice.value : undefined,
    children: slice.children.map(toRingNode),
  };
}

function rootNode(title: string, slices: BreakdownSlice[]): RingNode {
  return { id: ROOT_ID, name: title, color: ROOT_COLOR, children: slices.map(toRingNode) };
}

// Every slice of this level, and every slice inside it, points at the slice of this level it belongs to: a tap anywhere in a
// category's rings opens that category, the same as on the phone.
function ownerKeys(slices: BreakdownSlice[]): Map<string, string> {
  const owner = new Map<string, string>();
  const visit = (slice: BreakdownSlice, top: string) => {
    owner.set(slice.key, top);
    slice.children.forEach((child) => visit(child, top));
  };
  slices.forEach((slice) => visit(slice, slice.key));
  return owner;
}

function tapHandler(owner: Map<string, string>, zoomed: boolean, onSelect: (key: string) => void, onBack: () => void) {
  return (id: string | number) => {
    const key = String(id);
    if (key === ROOT_ID) {
      if (zoomed) onBack();
      return;
    }
    const top = owner.get(key);
    if (top) onSelect(top);
  };
}

function shareOf(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

// Nivo measures its own box, so it gets an absolute one inside the card's fixed-height panel.
function FillBox({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

export function BreakdownRing({ slices, total, level, title, currency, onSelect, onBack }: BreakdownChartProps): React.JSX.Element {
  const owner = useMemo(() => ownerKeys(slices), [slices]);
  const data = useMemo(() => rootNode(title, slices), [title, slices]);
  const tap = tapHandler(owner, level > 0, onSelect, onBack);
  return (
    <FillBox>
      <ResponsiveSunburst<RingNode>
        data={data}
        id="id"
        value="value"
        animate
        motionConfig="gentle"
        transitionMode="pushIn"
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        borderColor="#ffffff"
        colors={(node) => String(node.data.color)}
        inheritColorFromParent={false}
        enableArcLabels
        arcLabel={(node) => `${node.data.name} (${formatMoneyMajor(node.value, currency, { showCode: false })})`}
        arcLabelsRadiusOffset={0.05}
        arcLabelsSkipAngle={12}
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 1.4]] }}
        onClick={(node) => tap(node.id)}
        tooltip={(node) => (
          <div className="gf-glass-chip rounded-2xl px-3 py-2 text-sm font-semibold text-gf-text">
            {node.data.name}: {formatMoneyMajor(node.value, currency, { showCode: false })} · {shareOf(node.value, total)}%
          </div>
        )}
      />
    </FillBox>
  );
}

export function BreakdownBubbles({ slices, total, level, title, currency, onSelect, onBack }: BreakdownChartProps): React.JSX.Element {
  const owner = useMemo(() => ownerKeys(slices), [slices]);
  const data = useMemo(() => rootNode(title, slices), [title, slices]);
  const tap = tapHandler(owner, level > 0, onSelect, onBack);
  return (
    <FillBox>
      <ResponsiveCirclePacking<RingNode>
        data={data}
        id="id"
        value="value"
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        padding={10}
        colors={(node) => String(node.data.color)}
        childColor={{ from: "color" }}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.5]] }}
        enableLabels
        label={(node) => node.data.name}
        labelsFilter={(node) => node.node.depth === 1}
        labelsSkipRadius={9}
        labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
        motionConfig="slow"
        zoomedId={null}
        onClick={(node) => tap(node.id)}
        tooltip={(node) => (
          <div className="gf-glass-chip rounded-2xl px-3 py-2 text-sm font-semibold text-gf-text">
            {node.data.name}: {formatMoneyMajor(node.value, currency, { showCode: false })} · {shareOf(node.value, total)}%
          </div>
        )}
      />
    </FillBox>
  );
}

// The treemap lays out the level's slices flat, like the phone's: each tile is one slice of the level.
export function BreakdownMap({ slices, total, level, currency, onSelect }: BreakdownChartProps): React.JSX.Element {
  const [entered, setEntered] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const kind: TreemapNodeKind = level === 0 ? "category" : level === 1 ? "subcategory" : "transaction";
  const nodes = useMemo<TreemapNode[]>(
    () =>
      slices
        .filter((slice) => slice.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((slice) => ({
          key: slice.key,
          name: slice.name,
          color: slice.color,
          icon: slice.icon,
          value: slice.value,
          hasChildren: slice.children.length > 0,
          kind,
          transactionCount: slice.count,
        })),
    [slices, kind]
  );
  const rects = useMemo(() => squarify(nodes, 0, 0, NOMINAL_W, NOMINAL_H), [nodes]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {rects.map((rect, index) => (
        <TreemapTile
          key={rect.node.key}
          rect={rect}
          index={index}
          isBig={rect.width >= BIG_TILE_MIN_W && rect.height >= BIG_TILE_MIN_H}
          canDrill={level < 2}
          isSelected={false}
          pct={total > 0 ? ((rect.node.value / total) * 100).toFixed(1) : "0.0"}
          currency={currency}
          onClick={() => onSelect(rect.node.key)}
          entered={entered}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
}
