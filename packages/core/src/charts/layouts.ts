// Pure layouts for the category charts (no drawing): a treemap and a packed-circles chart. The phone draws
// the rectangles and circles these return; the web's TreeMap uses the same squarified algorithm.

export interface TreemapRect<T> {
  node: T;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Sized<T> {
  node: T;
  area: number;
}

function worstRatio<T>(row: Sized<T>[], shortSide: number): number {
  let sum = 0;
  let max = -Infinity;
  let min = Infinity;
  for (const item of row) {
    sum += item.area;
    if (item.area > max) max = item.area;
    if (item.area < min) min = item.area;
  }
  if (min <= 0) return Infinity;
  return Math.max((shortSide * shortSide * max) / (sum * sum), (sum * sum) / (shortSide * shortSide * min));
}

// Squarified treemap (Bruls, Huizing, van Wijk): rectangles whose areas are proportional to the values, kept as
// close to squares as possible. Zero or negative values are left out.
export function squarify<T extends { value: number }>(nodes: T[], x0: number, y0: number, w0: number, h0: number): TreemapRect<T>[] {
  const positive = nodes.filter((node) => node.value > 0).sort((a, b) => b.value - a.value);
  const total = positive.reduce((sum, node) => sum + node.value, 0);
  if (total <= 0 || positive.length === 0 || w0 <= 0 || h0 <= 0) return [];
  const scale = (w0 * h0) / total;
  let remaining: Sized<T>[] = positive.map((node) => ({ node, area: node.value * scale }));
  const rects: TreemapRect<T>[] = [];
  let x = x0;
  let y = y0;
  let w = w0;
  let h = h0;

  while (remaining.length) {
    const shortSide = Math.min(w, h);
    let row = [remaining[0]];
    let rowWorst = worstRatio(row, shortSide);
    let i = 1;
    while (i < remaining.length) {
      const trial = row.concat(remaining[i]);
      const trialWorst = worstRatio(trial, shortSide);
      if (trialWorst <= rowWorst) {
        row = trial;
        rowWorst = trialWorst;
        i += 1;
      } else break;
    }
    const rowArea = row.reduce((sum, item) => sum + item.area, 0);
    if (w >= h) {
      const rowWidth = rowArea / h;
      let ry = y;
      for (const item of row) {
        const itemHeight = item.area / rowWidth;
        rects.push({ node: item.node, x, y: ry, width: rowWidth, height: itemHeight });
        ry += itemHeight;
      }
      x += rowWidth;
      w -= rowWidth;
    } else {
      const rowHeight = rowArea / w;
      let rx = x;
      for (const item of row) {
        const itemWidth = item.area / rowHeight;
        rects.push({ node: item.node, x: rx, y, width: itemWidth, height: rowHeight });
        rx += itemWidth;
      }
      y += rowHeight;
      h -= rowHeight;
    }
    remaining = remaining.slice(row.length);
  }
  return rects;
}

export interface PackedCircle<T> {
  node: T;
  x: number;
  y: number;
  r: number;
}

// Packed circles with area proportional to the value: the biggest goes in the middle and each next one is placed
// as close to the middle as it fits without touching the others; the whole group is then scaled to fill the box
// and centered. A small gap is kept between circles.
export function packCircles<T extends { value: number }>(nodes: T[], width: number, height: number, gap = 2): PackedCircle<T>[] {
  const positive = nodes.filter((node) => node.value > 0).sort((a, b) => b.value - a.value);
  if (positive.length === 0 || width <= 0 || height <= 0) return [];
  const radii = positive.map((node) => Math.sqrt(node.value));
  const placed: { x: number; y: number; r: number }[] = [];

  positive.forEach((_, index) => {
    const r = radii[index];
    if (index === 0) {
      placed.push({ x: 0, y: 0, r });
      return;
    }
    // Walk outward along a spiral until the circle does not overlap the ones already placed.
    let angle = 0;
    let distance = placed[0].r + r;
    for (let guard = 0; guard < 20000; guard++) {
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const free = placed.every((other) => Math.hypot(other.x - x, other.y - y) >= other.r + r + gap / 2);
      if (free) {
        placed.push({ x, y, r });
        return;
      }
      angle += 0.35;
      distance += 0.35 * (r / (2 * Math.PI)) * 0.8;
    }
    placed.push({ x: distance, y: 0, r });
  });

  const minX = Math.min(...placed.map((c) => c.x - c.r));
  const maxX = Math.max(...placed.map((c) => c.x + c.r));
  const minY = Math.min(...placed.map((c) => c.y - c.r));
  const maxY = Math.max(...placed.map((c) => c.y + c.r));
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY));
  const offsetX = (width - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = (height - (maxY - minY) * scale) / 2 - minY * scale;
  return placed.map((c, index) => ({ node: positive[index], x: c.x * scale + offsetX, y: c.y * scale + offsetY, r: c.r * scale }));
}
