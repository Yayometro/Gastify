import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { usePathname } from 'expo-router';
import { Animated, Pressable, RefreshControl, Text, View, useColorScheme, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InfoTip, type InfoText } from '@/components/info-tip';
import { useTourScroller } from '@/components/tour/tour-target';
import { TutorialTip } from '@/components/tour/tutorial-tip';
import { BottomTabInset, Colors, MaxContentWidth, TabletContentWidth } from '@/constants/theme';
import { useIsTablet } from '@/hooks/use-device-class';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import { ambientScrollY } from '@/lib/ambient-scroll';
import { onTabReselect } from '@/lib/tab-reselect';
import { useT } from '@/i18n/client';
import { mobileScreenForPath, type MobileComponentTourId } from '@gastify/core/tour/mobileSteps';
import { tNow } from '@/i18n/now';

import { HelpSep } from '@/components/ui/help-sep';
// Layout shared by the phase 4 screens: a title, a line under it, and a scroll area that leaves room
// for the floating bar. Pulling down refreshes the data when onRefresh is given.
export function Screen({
  title,
  subtitle,
  refreshing = false,
  onRefresh,
  backLabel,
  onBack,
  hero,
  titleInfo,
  headerAction,
  pageTutorial = true,
  tutorial,
  children,
}: {
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  // A screen opened from another one (Cuentas, from Más) shows a link back above its title.
  backLabel?: string;
  onBack?: () => void;
  // On the tablet, a screen can replace its title with the web's own hero (the Wallet's name and panels).
  hero?: ReactNode;
  // A "?" next to the title that explains the whole screen.
  titleInfo?: InfoText;
  // An action at the right of the title (the bell of Inicio).
  headerAction?: ReactNode;
  // The compass that starts this screen's own tour, next to the title (on by default).
  pageTutorial?: boolean;
  tutorial?: MobileComponentTourId;
  children?: ReactNode;
}) {
  const t = useT();
  const tablet = useIsTablet();
  // Every screen can be pulled down to reload the data; a screen with its own reload passes `onRefresh`.
  const appRefresh = useRefreshAppData();
  // A second tap on this page's tab (or extra section) scrolls it to the top and refreshes it.
  const pathname = usePathname();
  const scroller = useRef<ScrollViewInstance>(null);
  // How far the page is scrolled, so the guided tutorial can bring a control into view.
  const offset = useRef(0);
  const tourScroller = useMemo(
    () => ({
      scrollBy: (delta: number) => scroller.current?.scrollTo({ y: Math.max(0, offset.current + delta), animated: true }),
      scrollToTop: () => scroller.current?.scrollTo({ y: 0, animated: false }),
    }),
    []
  );
  useTourScroller(tourScroller);
  const refreshNow = onRefresh ?? appRefresh.refresh;
  useEffect(() => onTabReselect((path) => {
    if (path !== pathname) return;
    scroller.current?.scrollTo({ y: 0, animated: true });
    refreshNow();
  }), [pathname, refreshNow]);
  // The background behind the page follows how far this page has been scrolled (the tabs keep their own position).
  useEffect(() => {
    ambientScrollY.setValue(0);
  }, [pathname]);
  const scheme = useColorScheme();
  const iconColor = Colors[scheme === 'dark' ? 'dark' : 'light'].text;
  return (
    <View className="flex-1 bg-gf-bg">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.ScrollView
          ref={scroller}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: ambientScrollY } } }], { useNativeDriver: true, listener: (event) => { offset.current = (event as { nativeEvent: { contentOffset: { y: number } } }).nativeEvent.contentOffset.y; } })}
          scrollEventThrottle={16}
          contentContainerClassName="w-full gap-4 self-center p-6"
          contentContainerStyle={{ paddingBottom: BottomTabInset + 84, maxWidth: tablet ? TabletContentWidth : MaxContentWidth }}
          refreshControl={<RefreshControl refreshing={onRefresh ? refreshing : appRefresh.refreshing} onRefresh={onRefresh ?? appRefresh.refresh} />}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backLabel ? tNow("mobile.volver.a.p1", { p1: backLabel }) : t("common.back")}
              onPress={onBack}
              hitSlop={8}
              className="-ml-1 flex-row items-center gap-1 self-start">
              <Ionicons name="chevron-back" size={22} color={iconColor} />
              <Text className="font-inter-medium text-base text-gf-text">{backLabel ?? t("common.back")}</Text>
            </Pressable>
          ) : null}
          {tablet && hero ? hero : (
            <View className="gap-1">
              <View className="flex-row items-center gap-3">
                {/* The title takes the room it needs and wraps; the help buttons never shrink, so a long name cannot push them off the row. */}
                <Text className="font-inter-bold text-4xl text-gf-text" style={{ flexShrink: 1 }}>{title}</Text>
                {titleInfo || tutorial || (pageTutorial && mobileScreenForPath(pathname)) ? (
                  <View className="flex-row items-center gap-3" style={{ flexShrink: 0 }}>
                    <HelpSep />
                    <View className="flex-row items-center gap-0.5">
                      {titleInfo ? <InfoTip info={titleInfo} /> : null}
                      {tutorial ? <TutorialTip tour={tutorial} label={title} /> : pageTutorial && mobileScreenForPath(pathname) ? <TutorialTip label={title} /> : null}
                    </View>
                  </View>
                ) : null}
                {headerAction ? <View className="ml-auto">{headerAction}</View> : null}
              </View>
              {subtitle ? <Text className="font-inter text-base text-gf-text-muted">{subtitle}</Text> : null}
            </View>
          )}
          {children}
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}
