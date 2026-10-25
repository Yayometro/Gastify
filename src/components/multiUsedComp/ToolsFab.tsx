"use client";

import React, { useEffect, useRef, useState } from "react";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import ToolsModal from "@/components/multiUsedComp/ToolsModal";
import { useT } from "@/i18n/client";

export interface ToolsFabProps {
  mail?: string | null;
}

// The button can rest on any border: the left or right edge at any height, or the top or bottom edge at any place along it.
// Let go, it settles on the nearest edge, and where it was left is remembered in this browser (the same as the app).
const SIZE = 48;
const EDGE = 12;
const STORE_KEY = "gf-tools-fab-spot";

type Edge = "left" | "right" | "top" | "bottom";
type Spot = { edge: Edge; ratio: number };
type Point = { x: number; y: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

const DEFAULT_SPOT: Spot = { edge: "right", ratio: 1 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The area the button may use: clear of the navigation bar (the side bar on wide screens, the bottom bar on phones).
function boundsNow(): Bounds {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const wide = width >= 768;
  const leftReserve = wide ? 96 : EDGE;
  const bottomReserve = wide ? 16 : 96;
  return { minX: leftReserve, maxX: width - SIZE - EDGE, minY: EDGE, maxY: height - bottomReserve - SIZE };
}

function spotPosition(spot: Spot, b: Bounds): Point {
  const r = clamp(spot.ratio, 0, 1);
  switch (spot.edge) {
    case "left": return { x: b.minX, y: b.minY + r * (b.maxY - b.minY) };
    case "right": return { x: b.maxX, y: b.minY + r * (b.maxY - b.minY) };
    case "top": return { x: b.minX + r * (b.maxX - b.minX), y: b.minY };
    default: return { x: b.minX + r * (b.maxX - b.minX), y: b.maxY };
  }
}

// The nearest edge wins, and the button keeps the place it was let go along it.
function snapOf(point: Point, b: Bounds): { point: Point; spot: Spot } {
  const x = clamp(point.x, b.minX, b.maxX);
  const y = clamp(point.y, b.minY, b.maxY);
  const distances: [Edge, number][] = [["left", x - b.minX], ["right", b.maxX - x], ["top", y - b.minY], ["bottom", b.maxY - y]];
  const edge = distances.reduce((best, item) => (item[1] < best[1] ? item : best))[0];
  const ratioX = (x - b.minX) / (b.maxX - b.minX || 1);
  const ratioY = (y - b.minY) / (b.maxY - b.minY || 1);
  switch (edge) {
    case "left": return { point: { x: b.minX, y }, spot: { edge, ratio: ratioY } };
    case "right": return { point: { x: b.maxX, y }, spot: { edge, ratio: ratioY } };
    case "top": return { point: { x, y: b.minY }, spot: { edge, ratio: ratioX } };
    default: return { point: { x, y: b.maxY }, spot: { edge, ratio: ratioX } };
  }
}

function readSpot(): Spot | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "null") as Partial<Spot> | null;
    const edges: Edge[] = ["left", "right", "top", "bottom"];
    return parsed && edges.includes(parsed.edge as Edge) && typeof parsed.ratio === "number" ? (parsed as Spot) : null;
  } catch {
    return null;
  }
}

// The floating "Tools" button (the sparkles) and the window it opens. A tap opens the window; a drag moves the button to
// the nearest border.
function ToolsFab({ mail }: ToolsFabProps): React.JSX.Element {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [spot, setSpot] = useState<Spot>(DEFAULT_SPOT);
  const [point, setPoint] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const pointRef = useRef<Point>({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean; pointerId: number } | null>(null);

  const place = (next: Point) => {
    pointRef.current = next;
    setPoint(next);
  };

  // Rests on its spot, and follows the window when it is resized (a rotation keeps it on the same edge).
  useEffect(() => {
    const saved = readSpot();
    if (saved) setSpot(saved);
  }, []);

  useEffect(() => {
    const settle = () => {
      if (drag.current) return;
      place(spotPosition(spot, boundsNow()));
    };
    settle();
    window.addEventListener("resize", settle);
    return () => window.removeEventListener("resize", settle);
  }, [spot]);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startY: event.clientY, originX: pointRef.current.x, originY: pointRef.current.y, moved: false, pointerId: event.pointerId };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) current.moved = true;
    if (current.moved) place({ x: current.originX + dx, y: current.originY + dy });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (!current.moved) {
      setOpen(true);
      return;
    }
    const bounds = boundsNow();
    const next = snapOf(pointRef.current, bounds);
    place(next.point);
    setSpot(next.spot);
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next.spot));
    } catch {
      // Not being able to remember it only means it goes back to the bottom right.
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("navbar.tools.open")}
        title={t("navbar.tools.drag")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") setOpen(true);
        }}
        style={{
          position: "fixed",
          left: point.x,
          top: point.y,
          width: SIZE,
          height: SIZE,
          zIndex: 2500,
          touchAction: "none",
          transition: dragging ? "none" : "left 260ms cubic-bezier(.2,.8,.2,1), top 260ms cubic-bezier(.2,.8,.2,1)",
        }}
        className="rounded-full gf-glass-button text-white flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        <CategoIcon type="MdAutoAwesome" siz={22} />
      </button>

      {open && <ToolsModal mail={mail} onClose={() => setOpen(false)} />}
    </>
  );
}

export default ToolsFab;
