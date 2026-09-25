import React from 'react';
import * as icons from 'react-icons/md';
import type { IconType } from 'react-icons';

export interface CategoIconProps {
  type: string;
  siz?: number | string;
  className?: string;
}

const CategoIcon = ({ type, siz, className }: CategoIconProps): React.JSX.Element => {
  const Icon = (icons as Record<string, IconType>)[type];
  return <Icon size={siz} className={className} />;
};

export default CategoIcon;