import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { authClient } from '@/auth-client';
import { FormError } from '@/components/auth/auth-layout';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { OutlineButton } from '@/components/ui/outline-button';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { shareExcelTemplate, uploadExcelTemplate } from '@/lib/export-file';
import { messageOf } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { APP_INFO } from '@gastify/core/info/appInfo';
import { useT } from "@/i18n/client";

// Import movements from Excel, as the web does: download the template, fill it in and upload it; the server reads it
// and creates the movements (categories, tags and accounts are matched with the ones the person already has).
export default function ImportScreen() {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { data: session } = authClient.useSession();
  const email = session?.user.email ?? '';
  const [busy, setBusy] = useState<'template' | 'upload' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; uncategorized: number } | null>(null);

  const template = async () => {
    setBusy('template');
    setError(null);
    try {
      await shareExcelTemplate(email, 'Plantilla de Gastify');
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(null);
    }
  };

  const upload = async () => {
    setError(null);
    setResult(null);
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', '*/*'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setBusy('upload');
    try {
      const answer = await uploadExcelTemplate(email, { uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      if (!answer.ok) {
        setError(answer.versionMismatch ? 'Tu plantilla es de una versión anterior. Descarga la plantilla de nuevo y vuelve a intentarlo.' : answer.message || 'No pudimos procesar el archivo.');
        return;
      }
      const created = answer.data?.length ?? 0;
      const uncategorized = (answer.data ?? []).filter((item) => !item.category && !item.subCategory).length;
      setResult({ created, uncategorized });
      toast.show(created === 1 ? '1 movimiento importado' : `${created} movimientos importados`);
      reloadAfterWrite(dispatch, true);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen title={t("mobile.importar.desde.excel")} backLabel="Movimientos" onBack={() => router.back()}>
      <Card title={t("mobile.1.descarga.la.plantilla")} info={APP_INFO.plantilla}>
        <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.se.guarda.como.archivo.excel")}</Text>
        <OutlineButton label={t("mobile.descargar.plantilla")} icon={<Ionicons name="download-outline" size={20} color="#7e22ce" />} onPress={template} loading={busy === 'template'} disabled={busy !== null || !email} />
      </Card>

      <Card title={t("mobile.2.sube.tu.archivo")}>
        <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.elige.el.archivo.xlsx.ya")}</Text>
        <GradientButton label={busy === 'upload' ? 'Importando…' : 'Elegir archivo e importar'} onPress={upload} loading={busy === 'upload'} disabled={busy !== null || !email} />
        <FormError message={error} />
        {result && (
          <View className="gap-1 rounded-2xl border border-gf-border p-3">
            <Text className="font-inter-semibold text-base text-gf-text">
              {result.created === 0 ? 'No se creó ningún movimiento' : `${result.created} ${result.created === 1 ? 'movimiento creado' : 'movimientos creados'}`}
            </Text>
            {result.uncategorized > 0 && (
              <Text className="font-inter text-sm text-gf-text-muted">
                {t("mobile.p1.quedaron.sin.categoria.el", { p1: result.uncategorized })}
              </Text>
            )}
          </View>
        )}
      </Card>
    </Screen>
  );
}
