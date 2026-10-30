import { useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';

// The thin vertical rule between a title (or an action) and the help buttons next to it ("?" and the tutorial's compass).
export function HelpSep() {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <View accessible={false} style={{ width: 1, height: 18, backgroundColor: colors.border }} />;
}
