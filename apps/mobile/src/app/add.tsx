import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch } from 'react-redux';

import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { MovementForm } from '@/components/movement-form';
import { TransferForm } from '@/components/transfer-form';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';

type Kind = 'expense' | 'income' | 'transfer';

const KINDS: { value: Kind; label: string }[] = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
  { value: 'transfer', label: 'Transferir' },
];

// The "+" of the bottom bar: a movement in two or three taps (type, amount, category), or a transfer
// between two accounts. What is saved goes straight to the same API routes the web uses.
export default function AddScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [kind, setKind] = useState<Kind>('expense');
  const [saved, setSaved] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  const finish = (message: string) => {
    setSaved(message);
    setRound((n) => n + 1);
    reloadAfterWrite(dispatch);
  };

  return (
    <Screen title="Agregar" subtitle="Un gasto, un ingreso o una transferencia entre tus cuentas.">
      <Segmented
        options={KINDS}
        value={kind}
        onChange={(next) => {
          setKind(next);
          setSaved(null);
        }}
      />

      {saved && (
        <Card>
          <Text className="font-inter-semibold text-base text-gf-text">{saved}</Text>
          <Pressable accessibilityRole="link" onPress={() => router.navigate('/movements')} hitSlop={8}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>
              Ver movimientos
            </Text>
          </Pressable>
        </Card>
      )}

      <View>
        {kind === 'transfer' ? (
          <TransferForm
            key={`transfer-${round}`}
            onSubmit={async (body) => {
              await sendWrite('general-data/transactions/transfer', body);
              finish('Transferencia guardada.');
            }}
          />
        ) : (
          <MovementForm
            key={`${kind}-${round}`}
            hideType
            type={kind}
            submitLabel="Guardar movimiento"
            onSubmit={async (body) => {
              await sendWrite('general-data/transactions/new-transaction', body);
              finish(kind === 'income' ? 'Ingreso guardado.' : 'Gasto guardado.');
            }}
          />
        )}
      </View>
    </Screen>
  );
}
