import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';
import { useT } from '@/i18n/client';
import { mobileComponentToursFor, type MobileScreen, type MobileTourId } from '@gastify/core/tour/mobileSteps';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function Option({ icon, title, hint, onPress }: { icon: IconName; title: string; hint?: string; onPress: () => void }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
      style={{ backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border }}>
      <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accentSoft }}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View className="flex-1">
        <Text className="font-inter-semibold text-base text-gf-text">{title}</Text>
        {hint ? <Text className="font-inter text-sm text-gf-text-muted">{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

// The menu behind the Tutorial row: this screen, how to get around, or the whole app; and, on a screen that has them, its in-depth
// tutorials, one per component.
export function TourMenu({
  visible,
  screen,
  onClose,
  onStart,
  onScreen,
  onFull,
}: {
  visible: boolean;
  screen: MobileScreen | null;
  onClose: () => void;
  onStart: (id: MobileTourId) => void;
  onScreen: () => void;
  onFull: () => void;
}) {
  const t = useT();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const components = screen ? mobileComponentToursFor(screen) : [];
  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="88%">
      <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
        <View className="flex-row items-center gap-3 px-6 pb-3 pt-6">
          <Ionicons name="compass" size={26} color="#c084fc" />
          <View className="flex-1">
            <Text className="font-inter-bold text-xl text-gf-text">{t('tour.menu.title')}</Text>
            <Text className="font-inter text-sm text-gf-text-muted">{t('tour.menu.subtitle')}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('mobile.cerrar')} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 10 }} showsVerticalScrollIndicator={false}>
          {screen ? (
            <Option icon="list-outline" title={t('tour.mMenu.page')} hint={t('tour.mMenu.pageHint')} onPress={onScreen} />
          ) : (
            <Text className="font-inter text-sm text-gf-text-muted">{t('tour.mMenu.noPage')}</Text>
          )}
          <Option icon="navigate-outline" title={t('tour.menu.basics')} hint={t('tour.menu.basicsHint')} onPress={() => onStart('mIntro')} />
          <Option icon="compass-outline" title={t('tour.menu.full')} hint={t('tour.menu.fullHint')} onPress={onFull} />
          {components.length > 0 ? (
            <View className="gap-2 pt-2">
              <Text className="font-inter-semibold text-base text-gf-text">{t('tour.menu.components')}</Text>
              <Text className="font-inter text-sm text-gf-text-muted">{t('tour.menu.componentsHint')}</Text>
              {components.map((id) => (
                <Option key={id} icon="compass-outline" title={t(`tour.${id}.name`)} onPress={() => onStart(id)} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </BottomSheet>
  );
}
