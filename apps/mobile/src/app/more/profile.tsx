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
import { longDateEs } from '@gastify/core/format/spanishDates';
import { PROFILE_NAME_MAX, buildProfileBody, initialsOf, profileToValues, validateProfile, type ProfileErrors } from '@gastify/core/profile/profileForm';

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
      toast.show('Perfil actualizado');
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Perfil" backLabel="Más" onBack={() => router.back()}>
      <View className="items-center gap-3">
        {user?.image ? (
          <Image source={{ uri: user.image }} style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }} contentFit="cover" alt="Tu foto de perfil" />
        ) : (
          <View style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: '#7e22ce', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Tus iniciales">
            <Text className="font-inter-bold text-3xl" style={{ color: '#ffffff' }}>{initialsOf(user?.fullName)}</Text>
          </View>
        )}
        <View className="items-center">
          <Text className="font-inter-bold text-xl text-gf-text">{user?.fullName || 'Tu cuenta'}</Text>
          <Text className="font-inter text-sm text-gf-text-muted">{email}</Text>
        </View>
      </View>

      <Card title="Tus datos">
        <View className="gap-2">
          <TextField label="Nombre" value={fullName} onChangeText={setFullName} maxLength={PROFILE_NAME_MAX} autoCapitalize="words" textContentType="name" />
          {errors.fullName && <Text className="font-inter text-sm text-red-500">{errors.fullName}</Text>}
        </View>
        <View className="gap-2">
          <TextField label="Teléfono (opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" placeholder="55 1234 5678" />
          {errors.phone && <Text className="font-inter text-sm text-red-500">{errors.phone}</Text>}
        </View>
        <FormError message={formError} />
        <GradientButton label="Guardar cambios" onPress={save} loading={saving} disabled={saving || unchanged} />
      </Card>

      <AccessCard email={email} />

      <CurrencyCard />

      <AppearanceCard />

      <Card title="Cuenta">
        <InfoRow label="Correo" value={email || '—'} />
        <InfoRow label="Moneda principal" value={currency} />
        {created && !Number.isNaN(created.getTime()) && <InfoRow label="Miembro desde" value={longDateEs(created)} />}
      </Card>

      <TwoFactorCard />
      <PasskeysCard />
      <ApiTokensCard />

      <Text className="font-inter text-sm text-gf-text-muted">La foto de perfil se cambia desde Gastify en la web.</Text>

      <DeleteAccountCard email={email} twoFactorEnabled={Boolean((session?.user as { twoFactorEnabled?: boolean } | undefined)?.twoFactorEnabled)} />
    </Screen>
  );
}
