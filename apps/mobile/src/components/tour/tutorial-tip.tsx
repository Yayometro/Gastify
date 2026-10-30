import { Ionicons } from '@expo/vector-icons';
import { Pressable, useColorScheme } from 'react-native';

import { useTourTarget } from '@/components/tour/tour-target';
import { useTour } from '@/components/tour/tour-provider';
import { Colors } from '@/constants/theme';
import { useT } from '@/i18n/client';
import { SCREEN_TOUR_ID, mobileScreenForPath, type MobileTourId } from '@gastify/core/tour/mobileSteps';

// The compass next to a title: it starts the tutorial of that screen or of that section. The question mark explains what a number
// means; this one shows, step by step, how to use the section. The welcome and every screen's tour teach both.
// `tour` is the tutorial it starts; without one, it starts the tour of the screen it is on. `label` is what the tutorial is called.
export function TutorialTip({ tour, label, pointer = true, size = 22 }: { tour?: MobileTourId; label: string; pointer?: boolean; size?: number }) {
  const t = useT();
  const api = useTour();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  // The first compass of the screen is the one the "buttons" card of its tour points at.
  const ref = useTourTarget(pointer ? 'm-tutorial-tip' : undefined);
  const text = t('tour.tip.label', { p1: label });
  return (
    <Pressable
      ref={ref}
      collapsable={false}
      accessibilityRole="button"
      accessibilityLabel={text}
      onPress={() => {
        if (tour) api.startTour(tour);
        else if (api.screen) api.startTour(SCREEN_TOUR_ID[api.screen]);
        else api.openMenu();
      }}
      hitSlop={10}
      className="items-center justify-center self-center">
      <Ionicons name="compass-outline" size={size} color={colors.textSecondary} />
    </Pressable>
  );
}

// Exposed for the screens that know their own path (the movements header).
export { mobileScreenForPath };
