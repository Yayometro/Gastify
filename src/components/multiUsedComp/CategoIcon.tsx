import React from 'react';
import { resolveIcon } from './UniversalCategoIcon';

export interface CategoIconProps {
  type: string;
  siz?: number | string;
  className?: string;
}

// Material icons only. A "md/MdName" type (the Universal format) is accepted too,
// and an unknown name draws nothing instead of crashing the page.
const CategoIcon = ({ type, siz, className }: CategoIconProps): React.JSX.Element | null => {
  const Icon = resolveIcon(type?.startsWith("md/") ? type : `md/${type}`);
  if (!Icon) return null;
  return <Icon size={siz} className={className} />;
};

export default CategoIcon;
