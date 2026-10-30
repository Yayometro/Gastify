import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { authClient } from '@/auth-client';
import { FormError } from '@/components/auth/auth-layout';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { AppearanceCard } from '@/components/appearance-card';
import { LanguageCard } from '@/components/profile/language-card';
import { CountryCard } from '@/components/profile/country-card';
import { AccessCard } from '@/components/profile/access-card';
import { CurrencyCard } from '@/components/profile/currency-card';
import { ApiTokensCard } from '@/components/profile/api-tokens-card';
import { DeleteAccountCard } from '@/components/profile/delete-account-card';
import { PasskeysCard } from '@/components/profile/passkeys-card';
import { TwoFactorCard } from '@/components/profile/two-factor-card';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import type { UserData } from '@gastify/core/features/userSlice';
import { updateUser } from '@gastify/core/features/userSlice';
import { longDate } from "@gastify/core/i18n/dates";
import { PROFILE_NAME_MAX, buildProfileBody, initialsOf, profileToValues, validateProfile, type ProfileErrors } from '@gastify/core/profile/profileForm';
import { useT, useLocale } from "@/i18n/client";

import { TourPressable, TourTarget } from '@/components/tour/tour-target';
const AVATAR = 96;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="font-inter text-base text-gf-text-muted">{label}</Text>
      <Text className="flex-1 text-right font-inter-semibold text-base text-gf-text" numberOfLines={1}>{value}</Text>
    </View>
  );
}

// The account: photo or initials, the data the web's profile shows and the two fields the phone can change
// (name and phone), then how the person signs in (e-mail and password) right under it.
export default function ProfileScreen() {
  const locale = useLocale();
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { data: session } = authClient.useSession();
  const user = useSelector((state: RootState) => state.userReducer.data) as UserData;
  const currency = usePrimaryCurrency();

  const saved = profileToValues(user);
  const [fullName, setFullName] = useState(saved.fullName);
  const [phone, setPhone] = useState(saved.phone);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The user arrives after the screen opens: fill the fields once, without overwriting what is being typed.
  const [filled, setFilled] = useState(Boolean(saved.fullName));
  useEffect(() => {
    if (!filled && saved.fullName) {
      setFullName(saved.fullName);
      setPhone(saved.phone);
      setFilled(true);
    }
  }, [filled, saved.fullName, saved.phone]);

  const email = user?.mail || session?.user.email || '';
  const created = user?.createdAt ? new Date(user.createdAt) : null;
  const unchanged = fullName.trim() === saved.fullName && phone.replace(/\D/g, '') === saved.phone;

  const save = async () => {
    const found = validateProfile({ fullName, phone });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      const updated = await sendWrite<UserData | null>('general-data/user/update-user', buildProfileBody({ fullName, phone }));
      if (updated && typeof updated === 'object') dispatch(updateUser(updated));
      toast.show(t("profile.data.saved"));
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={t("mobile.perfil")} backLabel={t("mobile.mas")} onBack={() => router.back()}>
      <TourTarget id="m-prof-header" className="items-center gap-3">
        {user?.image ? (
          <Image source={{ uri: user.image }} style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }} contentFit="cover" alt={t("mobile.tu.foto.de.perfil")} />
        ) : (
          <View style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: '#7e22ce', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={t("mobile.tus.iniciales")}>
            <Text className="font-inter-bold text-3xl" style={{ color: '#ffffff' }}>{initialsOf(user?.fullName)}</Text>
          </View>
        )}
        <View className="items-center">
          <Text className="font-inter-bold text-xl text-gf-text">{user?.fullName || t("errors.api.yourAccount")}</Text>
          <Text className="font-inter text-sm text-gf-text-muted">{email}</Text>
        </View>
      </TourTarget>

      <Card tour="m-prof-data" title={t("mobile.tus.datos")}>
        <View className="gap-2">
          <TextField label={t("mobile.nombre")} value={fullName} onChangeText={setFullName} maxLength={PROFILE_NAME_MAX} autoCapitalize="words" textContentType="name" />
          {errors.fullName && <Text className="font-inter text-sm text-red-500">{t(errors.fullName, { p1: PROFILE_NAME_MAX })}</Text>}
        </View>
        <View className="gap-2">
          <TextField label={t("mobile.telefono.opcional")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" placeholder="55 1234 5678" />
          {errors.phone && <Text className="font-inter text-sm text-red-500">{t(errors.phone)}</Text>}
        </View>
        <FormError message={formError} />
        <GradientButton label={t("mobile.guardar.cambios")} onPress={save} loading={saving} disabled={saving || unchanged} />
      </Card>

      <TourTarget id="m-prof-access"><AccessCard email={email} /></TourTarget>

      <TourTarget id="m-prof-currency"><CurrencyCard /></TourTarget>

      <TourTarget id="m-prof-appearance"><AppearanceCard /></TourTarget>

      <TourTarget id="m-prof-language"><LanguageCard /></TourTarget>

      <TourTarget id="m-prof-country"><CountryCard /></TourTarget>

      <Card tour="m-prof-account" title={t("mobile.cuenta")}>
        <InfoRow label={t("mobile.correo")} value={email || '—'} />
        <InfoRow label={t("mobile.moneda.principal")} value={currency} />
        {created && !Number.isNaN(created.getTime()) && <InfoRow label={t("mobile.miembro.desde")} value={longDate(created, locale)} />}
      </Card>

      <TourTarget id="m-prof-twofactor"><TwoFactorCard /></TourTarget>
      <TourTarget id="m-prof-passkeys"><PasskeysCard /></TourTarget>
      <TourTarget id="m-prof-tokens"><ApiTokensCard /></TourTarget>

      <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.la.foto.de.perfil.se")}</Text>

      <TourPressable id="m-prof-signout"
        accessibilityRole="button"
        accessibilityLabel={t("mobile.cerrar.sesion")}
        onPress={() => authClient.signOut()}
        className="items-center rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-base text-red-500">{t("mobile.cerrar.sesion")}</Text>
      </TourPressable>

      <TourTarget id="m-prof-delete"><DeleteAccountCard email={email} twoFactorEnabled={Boolean((session?.user as { twoFactorEnabled?: boolean } | undefined)?.twoFactorEnabled)} /></TourTarget>
    </Screen>
  );
}
