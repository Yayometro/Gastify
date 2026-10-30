import { useT } from "@/i18n/client";
import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { InfoTip, type InfoText } from '@/components/info-tip';
import { useTourTarget } from '@/components/tour/tour-target';
import { TutorialTip } from '@/components/tour/tutorial-tip';
import { GlassSurface } from '@/components/ui/glass';
import { hasMobileComponentTour, type MobileTourId } from '@gastify/core/tour/mobileSteps';

import { HelpSep } from '@/components/ui/help-sep';
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
export function Card({ title, info, action, onTitlePress, onHeaderPress, style, tour, tutorial, children }: { title?: string; info?: InfoText; action?: ReactNode; onTitlePress?: () => void; onHeaderPress?: () => void; style?: StyleProp<ViewStyle>; tour?: string; tutorial?: MobileTourId; children?: ReactNode }) {
  const t = useT();
  const fill = useContext(FillHeightContext);
  // `tour` is the id the guided tutorial points at; `tutorial` puts a compass next to the title that starts the card's own tutorial.
  const targetRef = useTourTarget(tour);
  // A card whose anchor names a component's tutorial shows its compass; `tutorial` can still name one explicitly.
  const componentTour = (tour && hasMobileComponentTour(tour) ? tour : tutorial) as MobileTourId | undefined;
  return (
    <GlassSurface targetRef={targetRef} style={[{ padding: 16, gap: 12 }, fill ? { flexGrow: 1 } : null, style]}>
      <FillHeightContext.Provider value={false}>
      {title || action || info || componentTour ? (
        <Pressable accessibilityRole={onHeaderPress ? 'button' : undefined} disabled={!onHeaderPress} onPress={onHeaderPress} className="flex-row items-center gap-2">
          {title ? onTitlePress ? (
            <Pressable accessibilityRole="link" accessibilityLabel={t("mobile.openLabel", { p1: title })} onPress={onTitlePress} hitSlop={8} className="flex-1">
              <Text className="font-inter-semibold text-base text-gf-text">{title}</Text>
            </Pressable>
          ) : <Text className="flex-1 font-inter-semibold text-base text-gf-text">{title}</Text> : <View className="flex-1" />}
          {info || componentTour ? (
            <>
              {!action ? <HelpSep /> : null}
              <View className="flex-row items-center gap-0.5">
                {info ? <InfoTip info={info} tourId={tour ? `${tour}-info` : undefined} /> : null}
                {componentTour ? <TutorialTip tour={componentTour} label={title ?? ''} pointer={false} /> : null}
              </View>
            </>
          ) : null}
          {action ? (
            <>
              <HelpSep />
              {action}
            </>
          ) : null}
        </Pressable>
      ) : null}
      {children}
      </FillHeightContext.Provider>
    </GlassSurface>
  );
}
