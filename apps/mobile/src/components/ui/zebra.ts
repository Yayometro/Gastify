import type { ViewStyle } from 'react-native';

// Alternating rows of a table: the first a little darker, the next lighter, the whole width of the row, so one row is
// told apart from the next at a glance.
export function zebra(index: number, dark: boolean): ViewStyle {
  const even = index % 2 === 0;
  if (dark) return { backgroundColor: even ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.09)' };
  return { backgroundColor: even ? 'rgba(27,16,61,0.07)' : 'rgba(255,255,255,0.7)' };
}
