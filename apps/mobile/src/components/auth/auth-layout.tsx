import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Shared frame of the sign-in screens: Gastify title, a card, and room for the keyboard.
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <View className="flex-1 bg-gf-bg">
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="grow justify-center gap-6 p-6">
            <View className="gap-2">
              <Text className="font-inter-bold text-4xl text-gf-text">{title}</Text>
              <Text className="font-inter text-base text-gf-text-muted">{subtitle}</Text>
            </View>
            <View className="gap-4 rounded-3xl bg-gf-surface p-5">{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// The red line under a form.
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" className="font-inter-medium text-sm text-red-500">
      {message}
    </Text>
  );
}
