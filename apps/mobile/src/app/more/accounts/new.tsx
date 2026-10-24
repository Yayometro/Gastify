import { router } from 'expo-router';
import { useDispatch } from 'react-redux';

import { AccountForm } from '@/components/forms/account-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { useT } from "@/i18n/client";

export default function NewAccountScreen() {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  return (
    <Screen title={t("mobile.nueva.cuenta")} backLabel="Cuentas" onBack={() => router.back()}>
      <AccountForm
        submitLabel="Crear cuenta"
        onSubmit={async (values) => {
          await sendWrite('general-data/accounts/new-account', values);
          toast.show('Cuenta creada');
          reloadAfterWrite(dispatch);
          router.back();
        }}
      />
    </Screen>
  );
}
