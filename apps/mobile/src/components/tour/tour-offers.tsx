import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { GradientButton } from '@/components/ui/gradient-button';
import { useT } from '@/i18n/client';

// What the tutorial offers by itself: the welcome (a first or second session) and, once, the news that an account from before the
// tutorial has one now.
export type Offer = 'welcome' | 'announce';

export function TourOffers({
  offer,
  onStart,
  onLater,
  onNever,
  onOpenMenu,
  onAnnounced,
}: {
  offer: Offer | null;
  onStart: () => void;
  onLater: () => void;
  onNever: () => void;
  onOpenMenu: () => void;
  onAnnounced: () => void;
}) {
  const t = useT();
  const welcome = offer === 'welcome';
  return (
    <BottomSheet visible={offer !== null} onClose={welcome ? onLater : onAnnounced} maxHeight="70%">
      <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
        <View className="gap-4 px-6 pb-6 pt-6">
          <View className="flex-row items-center gap-3">
            <Ionicons name="compass" size={28} color="#c084fc" />
            <Text className="flex-1 font-inter-bold text-xl text-gf-text">{welcome ? t('tour.mOffer.welcome.title') : t('tour.mOffer.announce.title')}</Text>
          </View>
          <Text className="font-inter text-base text-gf-text">{welcome ? t('tour.mOffer.welcome.body') : t('tour.mOffer.announce.body')}</Text>
          <GradientButton label={welcome ? t('tour.mOffer.welcome.start') : t('tour.mOffer.announce.open')} onPress={welcome ? onStart : onOpenMenu} />
          <Pressable accessibilityRole="button" onPress={welcome ? onLater : onAnnounced} className="items-center py-2">
            <Text className="font-inter-semibold text-base text-gf-text-muted">{welcome ? t('tour.mOffer.welcome.later') : t('tour.mOffer.announce.ok')}</Text>
          </Pressable>
          {welcome ? (
            <Pressable accessibilityRole="button" onPress={onNever} className="items-center">
              <Text className="font-inter text-sm text-gf-text-muted">{t('tour.mOffer.welcome.never')}</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </BottomSheet>
  );
}
