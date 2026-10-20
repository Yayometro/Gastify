import { router } from 'expo-router';
import { useDispatch } from 'react-redux';

import { AccountForm } from '@/components/forms/account-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';

export default function NewAccountScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  return (
    <Screen title="Nueva cuenta" backLabel="Cuentas" onBack={() => router.back()}>
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
