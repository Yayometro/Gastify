"use client";

import React, { useState } from "react";
import { LEGACY_ICONS } from "@/components/icons/legacyIconRegistry";
import { fluentIconUrl, fluentSlugFor, normalizeLegacyName } from "@/components/icons/fluentIcons";
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
// Returns the react-icons component for a legacy name (null if there is none).
export function resolveIcon(type?: string): IconType | null {
  if (!type) return null;
  return LEGACY_ICONS[normalizeLegacyName(type)] ?? null;
}

// Draws a category icon. Names "fluent/<slug>" - and old react-icons names that have a
// Fluent equivalent (iconLegacyMap.ts) - draw as the Fluent Emoji 3D image; everything
// else (interface icons, brand logos) keeps drawing as a react-icons vector. Emoji
// images keep their own colors, so `colore` only applies to vector icons.
function UniversalCategoIcon({ type, siz, colore, className }: UniversalCategoIconProps): React.JSX.Element | null {
  const slug = fluentSlugFor(type);
  const [imageFailed, setImageFailed] = useState(false);

  if (slug && !imageFailed) {
    // Callers size icons either with `siz` or with Tailwind classes (w-[35px]...). A vector
    // icon obeys the class over its size attribute, so the image does too: an inline size
    // is only set when no class gives one, otherwise it would override the class.
    const hasSizeClass = Boolean(className && /(^|[\s:])(w|h|size)-/.test(className));
    const size = hasSizeClass ? undefined : typeof siz === "number" ? `${siz}px` : siz || "1em";
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny static WebP, many per page; next/image would only add overhead
      <img
        src={fluentIconUrl(slug)}
        alt=""
        role="presentation"
        loading="lazy"
        decoding="async"
        draggable={false}
        className={className}
        style={{ ...(size ? { width: size, height: size } : null), objectFit: "contain", display: "inline-block", flexShrink: 0 }}
        onError={() => setImageFailed(true)}
      />
    );
  }

  const Icon = resolveIcon(type);
  if (!Icon) return null;
  return <Icon size={siz} color={colore} className={className} />;
}

export default UniversalCategoIcon;
