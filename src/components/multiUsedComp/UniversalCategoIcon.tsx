import React from "react";
import * as md from "react-icons/md";
import * as fa from "react-icons/fa";
import * as ai from "react-icons/ai";
import * as gi from "react-icons/gi";
import type { IconType } from "react-icons";

export interface UniversalCategoIconProps {
  type?: string;
  siz?: number | string;
  colore?: string;
  className?: string;
}

const COLLECTIONS: Record<string, Record<string, IconType>> = {
  md: md as unknown as Record<string, IconType>,
  fa: fa as unknown as Record<string, IconType>,
  ai: ai as unknown as Record<string, IconType>,
  gi: gi as unknown as Record<string, IconType>,
};

// An icon is named "collection/IconName" ("md/MdFilterNone"). Several producers
// (the category/chart transformers' fallbacks) hand over the bare name
// ("MdFilterNone"), which used to resolve to nothing and draw no icon (bug 23): the
// collection is inferred from the name's first two letters, the way the old
// commented-out branch of this component did.
export function resolveIcon(type?: string): IconType | null {
  if (!type) return null;
  const hasPrefix = type.includes("/");
  const collectionName = hasPrefix ? type.split("/")[0] : type.substring(0, 2).toLowerCase();
  const iconName = hasPrefix ? type.split("/")[1] : type;
  return COLLECTIONS[collectionName]?.[iconName] ?? null;
}

function UniversalCategoIcon({ type, siz, colore, className }: UniversalCategoIconProps): React.JSX.Element | null {
  const Icon = resolveIcon(type);
  if (!Icon) return null;
  return <Icon size={siz} color={colore} className={className} />;
}

export default UniversalCategoIcon;
