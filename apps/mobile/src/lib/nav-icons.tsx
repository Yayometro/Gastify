import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';

// The icons of the sections, one set for the whole app (the iPad's side bar): the same glyph in the iPhone's "Más" list
// and in the bottom bar, so a section looks the same wherever it is. Filled glyphs on purpose.
export const NAV_ICON = {
  movements: (color: string, size = 24): ReactNode => <FontAwesome6 name="money-bill-transfer" size={size - 2} color={color} />,
  wallet: (color: string, size = 24): ReactNode => <FontAwesome6 name="wallet" size={size - 2} color={color} />,
  budgets: (color: string, size = 24): ReactNode => <MaterialIcons name="savings" size={size + 3} color={color} />,
  projections: (color: string, size = 24): ReactNode => <MaterialIcons name="auto-graph" size={size + 3} color={color} />,
  analyzer: (color: string, size = 24): ReactNode => <FontAwesome6 name="magnifying-glass-chart" size={size - 2} color={color} />,
  accounts: (color: string, size = 24): ReactNode => <MaterialIcons name="account-balance" size={size + 2} color={color} />,
  categories: (color: string, size = 24): ReactNode => <MaterialIcons name="category" size={size + 2} color={color} />,
  history: (color: string, size = 24): ReactNode => <FontAwesome6 name="clock-rotate-left" size={size - 2} color={color} />,
};
