import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { getApiBaseUrl } from '@gastify/core/api/client';
import { FLUENT_PREFIX } from '@gastify/core/icons/fluentIcons';
import { loadFluentManifest, searchFluentIcons, type FluentManifestIcon } from '@gastify/core/icons/fluentManifest';

// The Fluent icon library (the same one the web picker uses): a search box (Spanish or English) and the
// matching icons, a page at a time with "Mostrar más". The list is loaded once, when the picker opens.
const PAGE = 60;
export function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [icons, setIcons] = useState<FluentManifestIcon[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    loadFluentManifest(getApiBaseUrl())
      .then(setIcons)
      .catch(() => setFailed(true));
  }, []);

  const found = useMemo(() => (icons ? searchFluentIcons(icons, query) : []), [icons, query]);
  const matches = found.slice(0, limit);

  return (
    <View className="gap-3">
      <TextField
        label="Buscar ícono"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setLimit(PAGE);
        }}
        placeholder="comida, casa, avión…"
        autoCapitalize="none"
      />
      {icons !== null && !failed && (
        <Text className="font-inter text-sm text-gf-text-muted">
          {found.length === 1 ? '1 ícono' : `${found.length} íconos`}
        </Text>
      )}
      {failed ? (
        <Text className="font-inter text-sm text-red-500">No pudimos cargar los íconos. Revisa tu conexión.</Text>
      ) : icons === null ? (
        <ActivityIndicator color={colors.accent} />
      ) : matches.length === 0 ? (
        <Text className="font-inter text-sm text-gf-text-muted">Ningún ícono coincide con la búsqueda.</Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {matches.map((icon) => {
            const name = `${FLUENT_PREFIX}${icon.slug}`;
            const selected = name === value;
            return (
              <Pressable
                key={icon.slug}
                accessibilityRole="radio"
                accessibilityLabel={icon.name}
                accessibilityState={{ selected }}
                onPress={() => onChange(name)}
                className="h-14 w-14 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: selected ? colors.accent : colors.border,
                  backgroundColor: selected ? colors.accentSoft : colors.backgroundElement,
                }}>
                <CategoryIcon name={name} size={34} />
              </Pressable>
            );
          })}
        </View>
      )}
      {found.length > limit && (
        <Pressable accessibilityRole="button" onPress={() => setLimit((current) => current + 120)} className="items-center py-2">
          <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>
            Mostrar más ({found.length - limit} restantes)
          </Text>
        </Pressable>
      )}
    </View>
  );
}
