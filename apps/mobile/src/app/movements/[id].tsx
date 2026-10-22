import { router, useLocalSearchParams } from 'expo-router';

import { goBackTo, returnLabel, returnParam } from '@/lib/return-to';
import { Alert, Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { MovementForm } from '@/components/movement-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { tagNames } from '@/lib/tags';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { dateText } from '@gastify/core/transactions/movementForm';
import { isBeforeCutoff, movementTime } from '@gastify/core/transactions/historyWindow';
import { movementKind } from '@gastify/core/transactions/monthSummary';
import { removeOneTransacction } from '@gastify/core/features/transacctionsSlice';
import { useState } from 'react';

// One movement, edited with the same form as Agregar. Transfers cannot be edited field by field
// (both sides are kept together), so they can only be deleted here.
export default function MovementDetailScreen() {
  const { id: rawId, returnTo: rawReturn } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const returnTo = returnParam(rawReturn);
  const id = String(rawId ?? '');
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer);
  const movement = transactions.data.find((item) => String(item._id) === id);
  const cutoff = transactions.historyCutoff ?? null;
  const olderTouched = Boolean(movement && cutoff && isBeforeCutoff(movement, cutoff));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const back = () => goBackTo(returnTo, () => (router.canGoBack() ? router.back() : router.replace('/movements')));
  const backLabel = returnLabel(returnTo, 'Movimientos');

  if (!movement) {
    return (
      <Screen title="Movimiento" backLabel={backLabel} onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">No encontramos este movimiento. Puede que ya se haya borrado.</Text>
      </Screen>
    );
  }

  const kind = movementKind(movement);
  const time = movementTime(movement);

  const remove = () => {
    Alert.alert('Borrar este movimiento', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setError(null);
          try {
            await sendWrite(`general-data/transactions/remove-transaction/${id}`, {});
            dispatch(removeOneTransacction(id));
            toast.show('Movimiento borrado');
            reloadAfterWrite(dispatch, olderTouched);
            back();
          } catch (e) {
            setError(messageOf(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const save = async (body: Record<string, unknown>) => {
    await sendWrite(`general-data/transactions/${id}`, body);
    toast.show('Cambios guardados');
    reloadAfterWrite(dispatch, olderTouched);
    back();
  };

  // The tags as chips (the form below keeps them editable as text).
  const tagList = tagNames(movement.tags);
  return (
    <Screen title="Movimiento" subtitle={movement.name || undefined} backLabel={backLabel} onBack={back}>
      {kind === 'transfer' ? (
        <Card title="Transferencia">
          <Text className="font-inter text-base text-gf-text-muted">
            Las transferencias se guardan como dos movimientos ligados. Para corregirla, bórrala y créala de nuevo.
          </Text>
          {error && <Text className="font-inter text-sm text-red-500">{error}</Text>}
          <Pressable accessibilityRole="button" disabled={busy} onPress={remove} className="items-center py-2">
            <Text className="font-inter-semibold text-base text-red-500">Borrar transferencia</Text>
          </Pressable>
        </Card>
      ) : (
        <View className="gap-4">
          {tagList.length > 0 && <TagChips tags={tagList} />}
          <MovementForm
            key={id}
            submitLabel="Guardar cambios"
            initial={{
              type: kind === 'income' ? 'income' : 'expense',
              amount: String(movement.amount ?? ''),
              name: movement.name ?? '',
              accountId: idOf(movement.account),
              categoryId: idOf(movement.category),
              subCategoryId: idOf(movement.subCategory),
              budgetId: idOf(movement.budget),
              date: dateText(new Date(time ?? Date.now())),
              tags: tagNames(movement.tags).join(', '),
            }}
            onSubmit={save}
            onDelete={remove}
          />
        </View>
      )}
    </Screen>
  );
}

// The tags of a movement as chips: the accent color on a soft fill, so they read in both themes.
function TagChips({ tags }: { tags: string[] }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Card title="Etiquetas">
      <View className="flex-row flex-wrap gap-2">
        {tags.map((tag) => (
          <View key={tag} className="rounded-full px-3 py-1" style={{ backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border }}>
            <Text className="font-inter-medium text-sm" style={{ color: colors.accent }}>{tag}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
