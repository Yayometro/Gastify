import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from "@/i18n/client";

export default function TabTwoScreen() {
  const t = useT();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">{t("mobile.explore")}</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            {t("mobile.this.starter.app.includes.example", {  })}
          </ThemedText>

          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <ThemedText type="link">{t("mobile.expo.documentation")}</ThemedText>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title={t("mobile.file.based.routing")}>
            <ThemedText type="small">
              {t("mobile.this.app.has.two.screens")} <ThemedText type="code">{t("mobile.src.app.index.tsx")}</ThemedText> {t("mobile.and")}{' '}
              <ThemedText type="code">{t("mobile.src.app.explore.tsx")}</ThemedText>
            </ThemedText>
            <ThemedText type="small">
              {t("mobile.the.layout.file.in")} <ThemedText type="code">{t("mobile.src.app.layout.tsx")}</ThemedText> {t("mobile.sets.up.the.tab.navigator")}
            </ThemedText>
            <ExternalLink href="https://docs.expo.dev/router/introduction">
              <ThemedText type="linkPrimary">{t("mobile.learn.more")}</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title={t("mobile.android.ios.and.web.support")}>
            <ThemedView type="backgroundElement" style={styles.collapsibleContent}>
              <ThemedText type="small">
                {t("mobile.you.can.open.this.project")} <ThemedText type="smallBold">{t("mobile.w")}</ThemedText> {t("mobile.in.the.terminal.running.this")}
              </ThemedText>
              <Image
                source={require('@/assets/images/tutorial-web.png')}
                style={styles.imageTutorial}
              />
            </ThemedView>
          </Collapsible>

          <Collapsible title={t("mobile.images")}>
            <ThemedText type="small">
              {t("mobile.for.static.images.you.can")} <ThemedText type="code">{t("mobile.2x")}</ThemedText> {t("mobile.and")}{' '}
              <ThemedText type="code">{t("mobile.3x")}</ThemedText> {t("mobile.suffixes.to.provide.files.for")}
            </ThemedText>
            <Image source={require('@/assets/images/react-logo.png')} style={styles.imageReact} />
            <ExternalLink href="https://reactnative.dev/docs/images">
              <ThemedText type="linkPrimary">{t("mobile.learn.more")}</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title={t("mobile.light.and.dark.mode.components")}>
            <ThemedText type="small">
              {t("mobile.this.template.has.light.and")}{' '}
              <ThemedText type="code">{t("mobile.usecolorscheme")}</ThemedText> {t("mobile.hook.lets.you.inspect.what")}
            </ThemedText>
            <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
              <ThemedText type="linkPrimary">{t("mobile.learn.more")}</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title={t("mobile.animations")}>
            <ThemedText type="small">
              {t("mobile.this.template.includes.an.example")}{' '}
              <ThemedText type="code">{t("mobile.src.components.ui.collapsible.tsx")}</ThemedText> {t("mobile.component.uses.the.powerful")} <ThemedText type="code">{t("mobile.react.native.reanimated")}</ThemedText> {t("mobile.library.to.animate.opening.this")}
            </ThemedText>
          </Collapsible>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
});
