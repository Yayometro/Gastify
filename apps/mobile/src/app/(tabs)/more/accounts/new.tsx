import { router } from 'expo-router';
import { useDispatch } from 'react-redux';

import { AccountForm } from '@/components/forms/account-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { useT, useInfo } from "@/i18n/client";

export default function NewAccountScreen() {
  const { APP_INFO } = useInfo();
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  return (
    <Screen tutorial="m-accform" titleInfo={APP_INFO.formulario_cuenta} title={t("mobile.nueva.cuenta")} backLabel={t("accounts.title")} onBack={() => router.back()}>
      <AccountForm
        submitLabel={t("mobile.crear.cuenta")}
        onSubmit={async (values) => {
          await sendWrite('general-data/accounts/new-account', values);
          toast.show(t("mobile.cuenta.creada"));
          reloadAfterWrite(dispatch);
          router.back();
        }}
      />
    </Screen>
  );
}
