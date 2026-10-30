import type { BreakdownSlice } from "@gastify/core/history/categoryBreakdown";

// The data the rings and the bubbles draw, and the ids they are drawn with. Kept apart from the charts so it can be tested on its own.

// The root the rings and the bubbles hang from. It is the centre, not a slice: tapping it goes back up.
export const ROOT_ID = "__breakdown_root__";
const ROOT_COLOR = "#6b21a8";

export interface RingNode {
  // Unique across the whole tree (see pathId): nivo uses it as the React key of every node, and lays all the levels out in one list.
  id: string;
  // What the person reads, in the label and the tooltip. A name is not unique: "Sin subcategoría" sits under every category.
  name: string;
  color: string;
  // A movement (the deepest level): the bubbles draw it in a darker shade of its category's colour.
  movement: boolean;
  value?: number;
  children?: RingNode[];
}

// The id of the slice at the end of `keys`, a path of slice keys from the top down. Each key is escaped, so a "/" inside a name
// cannot make two different paths read the same.
export function pathId(keys: readonly string[]): string {
  return keys.map((key) => encodeURIComponent(key)).join("/");
}

// Parents take the sum of their children, so only the leaves carry a value of their own. `level` is the level the slice sits at.
function toRingNode(slice: BreakdownSlice, level: number, parentKeys: readonly string[]): RingNode {
  const keys = [...parentKeys, slice.key];
  const isLeaf = slice.children.length === 0;
  return {
    id: pathId(keys),
    name: slice.name,
    color: slice.color,
    movement: level === 2,
    value: isLeaf ? slice.value : undefined,
    children: slice.children.map((child) => toRingNode(child, level + 1, keys)),
  };
}

export function rootNode(title: string, slices: BreakdownSlice[], level: number): RingNode {
  return { id: ROOT_ID, name: title, color: ROOT_COLOR, movement: false, children: slices.map((slice) => toRingNode(slice, level, [])) };
}

// Every slice of this level, and every slice inside it, points at the slice of this level it belongs to: a tap anywhere in a
// category's rings opens that category, the same as on the phone. Keyed by the same path ids the nodes carry.
export function ownerKeys(slices: BreakdownSlice[]): Map<string, string> {
  const owner = new Map<string, string>();
  const visit = (slice: BreakdownSlice, top: string, parentKeys: readonly string[]) => {
    const keys = [...parentKeys, slice.key];
    owner.set(pathId(keys), top);
    slice.children.forEach((child) => visit(child, top, keys));
  };
  slices.forEach((slice) => visit(slice, slice.key, []));
  return owner;
}
