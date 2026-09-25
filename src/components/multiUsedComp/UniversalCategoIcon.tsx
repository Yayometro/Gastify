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

function UniversalCategoIcon({ type, siz, colore, className }: UniversalCategoIconProps): React.JSX.Element | null {
  if (!type) return null;
  // if (type.includes("/")) {
    // console.log(type);
    const [collectionName, iconName] = type.split("/");
    // Material
    if (collectionName === "md") {
      const Icon = (md as Record<string, IconType>)[iconName];
      return <Icon size={siz} color={colore} className={className} />;
    }
    if (collectionName === "fa") {
      const Icon = (fa as Record<string, IconType>)[iconName];
      return <Icon size={siz} color={colore} className={className} />;
    }
    if (collectionName === "ai") {
      const Icon = (ai as Record<string, IconType>)[iconName];
      return <Icon size={siz} color={colore} className={className} />;
    }
    if (collectionName === "gi") {
      const Icon = (gi as Record<string, IconType>)[iconName];
      return <Icon size={siz} color={colore} className={className} />;
    }
    //
  // } 
  // else {
  //   // console.log(type)
  //   // Convertir las dos primeras letras a minúsculas
  //   const startingWith = type.substring(0, 2).toLowerCase();
  //   let Icon = null;

  //   const mdRegex = /^md/i;
  //   const faRegex = /^fa/i;
  //   const aiRegex = /^ai/i;
  //   const giRegex = /^gi/i;

  //   if (mdRegex.test(startingWith)) {
  //     Icon = md[type];
  //   } else if (faRegex.test(startingWith)) {
  //     Icon = fa[type];
  //   } else if (aiRegex.test(startingWith)) {
  //     Icon = ai[type];
  //   } else if (giRegex.test(startingWith)) {
  //     Icon = gi[type];
  //   }

  //   if (Icon) {
  //     return <Icon size={siz} color={colore} className={className} />;
  //   } else {
  //       throw new Error(`There was a problem rendering the icon in UniversalIconComponent`)
  //   }
  // }
  return null;
}

export default UniversalCategoIcon;
