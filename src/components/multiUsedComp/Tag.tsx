import React from "react";
import { readableTextColor } from "@/helpers/readableTextColor";

export interface TagItem {
  _id?: string;
  name?: string;
  color?: string;
  [key: string]: unknown;
}

export interface TagProps {
  tag?: TagItem | null;
  size?: number | string;
}

function Tag({ tag, size }: TagProps): React.JSX.Element {
  if (!tag) return <p>No tag...</p>;
  // A tag with its own colour keeps it, with text that stays readable on it. A tag
  // without one (all of them today) follows the theme: it used to fall back to a
  // fixed light grey with the page's text colour, which is white-on-white in dark
  // mode.
  const ownTextColor = readableTextColor(tag.color);
  const colors = tag.color
    ? { backgroundColor: tag.color, color: ownTextColor ?? "var(--gf-text)" }
    : { backgroundColor: "var(--gf-accent-soft-bg)", color: "var(--gf-accent-soft-text)" };
  return (
    <div
      className="leading-none rounded-full px-1.5 py-0.5 text-center flex items-center border border-[var(--gf-border)] h-full"
      style={{
        ...colors,
        fontSize: size + "px",
        lineHeight: "normal",
      }}
    >
      {tag.name}
    </div>
  );
}

export default Tag;
