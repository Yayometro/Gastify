import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { InfoTip, type InfoText } from '@/components/info-tip';
import { GlassSurface } from '@/components/ui/glass';

// Inside a `PairedColumn` a card stretches to the height of its row, so two cards side by side end at the same line.
const FillHeightContext = createContext(false);

// One half of a row of two cards (iPad): both halves are as tall as the taller one.
export function PairedColumn({ children }: { children: ReactNode }) {
  return (
    <FillHeightContext.Provider value>
      <View style={{ flex: 1 }}>{children}</View>
    </FillHeightContext.Provider>
  );
}

// A rounded surface, the same as the web's cards. The optional title sits on the left; on the right, the optional
// action (a link, a button) and, when `info` is given, the "?" in the top right corner.
export function Card({ title, info, action, onTitlePress, onHeaderPress, style, children }: { title?: string; info?: InfoText; action?: ReactNode; onTitlePress?: () => void; onHeaderPress?: () => void; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const fill = useContext(FillHeightContext);
  return (
    <GlassSurface style={[{ padding: 16, gap: 12 }, fill ? { flexGrow: 1 } : null, style]}>
      <FillHeightContext.Provider value={false}>
      {title || action || info ? (
        <Pressable accessibilityRole={onHeaderPress ? 'button' : undefined} disabled={!onHeaderPress} onPress={onHeaderPress} className="flex-row items-center justify-between gap-3">
          {title ? onTitlePress ? (
            <Pressable accessibilityRole="link" accessibilityLabel={`Abrir ${title}`} onPress={onTitlePress} hitSlop={8} className="flex-1">
              <Text className="font-inter-semibold text-base text-gf-text">{title}</Text>
            </Pressable>
          ) : <Text className="flex-1 font-inter-semibold text-base text-gf-text">{title}</Text> : <View className="flex-1" />}
          <View className="flex-row items-center gap-3">
            {action}
            {info ? <InfoTip info={info} /> : null}
          </View>
        </Pressable>
      ) : null}
      {children}
      </FillHeightContext.Provider>
    </GlassSurface>
  );
}
