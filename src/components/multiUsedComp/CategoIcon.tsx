import React from 'react';
import * as icons from 'react-icons/md';
import type { IconType } from 'react-icons';

export interface CategoIconProps {
  type: string;
  siz?: number | string;
  className?: string;
}

// Material icons only. A "md/MdName" type (the Universal format) is accepted too,
// and an unknown name draws nothing instead of crashing the page.
const CategoIcon = ({ type, siz, className }: CategoIconProps): React.JSX.Element | null => {
  const name = type?.startsWith("md/") ? type.slice(3) : type;
  const Icon = (icons as Record<string, IconType>)[name];
  if (!Icon) return null;
  return <Icon size={siz} className={className} />;
};

export default CategoIcon;
