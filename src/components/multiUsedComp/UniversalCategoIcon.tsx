import React from "react";
import { LEGACY_ICONS } from "@/components/icons/legacyIconRegistry";
import type { IconType } from "react-icons";

export interface UniversalCategoIconProps {
  type?: string;
  siz?: number | string;
  colore?: string;
  className?: string;
}

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
  return LEGACY_ICONS[`${collectionName}/${iconName}`] ?? null;
}

function UniversalCategoIcon({ type, siz, colore, className }: UniversalCategoIconProps): React.JSX.Element | null {
  const Icon = resolveIcon(type);
  if (!Icon) return null;
  return <Icon size={siz} color={colore} className={className} />;
}

export default UniversalCategoIcon;
