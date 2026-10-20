import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, SectionList, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { CategoryBadge } from '@/components/category-badge';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { idOf } from '@gastify/core/categories/categoryForm';
import type { CategoryData } from '@gastify/core/features/categoriesSlice';
import type { SubCategoryData } from '@gastify/core/features/subCategorySlice';
import { normalizeText } from '@gastify/core/search/normalizeText';

export type CategoryChoice = { categoryId: string; subCategoryId: string };

type Entry = { key: string; kind: 'cat' | 'sub'; id: string; label: string; icon?: string; color?: string; parentId: string; parentLabel: string };
type Section = { title: string; data: Entry[] };

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// The first letter of a name, without accents; anything that is not a letter goes under "#".
function letterOf(text: string): string {
  const first = normalizeText(text).charAt(0).toUpperCase();
  return LETTERS.includes(first) ? first : '#';
}

const byName = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true });

// The categories and their sub-categories, the same as the web's picker: the chosen one shows as a chip,
// "Ver todas" opens the full list. In the list the categories are alphabetical, each with its sub-categories
// under it; a letter on the right jumps there. Searching splits the results into categories and sub-categories.
export function CategoryPicker({
  categories,
  subCategories,
  value,
  onChange,
  allLabel = 'Todas',
}: {
  categories: CategoryData[];
  subCategories: SubCategoryData[];
  value: CategoryChoice;
  onChange: (next: CategoryChoice) => void;
  allLabel?: string;
}) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listRef = useRef<SectionList<Entry, Section>>(null);

  const catEntries = useMemo<Entry[]>(
    () =>
      categories
        .map((category) => ({ key: `cat-${idOf(category)}`, kind: 'cat' as const, id: idOf(category), label: category.name || 'Categoría', icon: category.icon, color: category.color, parentId: '', parentLabel: '' }))
        .sort((a, b) => byName(a.label, b.label)),
    [categories]
  );
  const subEntries = useMemo<Entry[]>(
    () =>
      subCategories
        .map((sub) => {
          const parentId = idOf(sub.fatherCategory);
          const parent = categories.find((category) => idOf(category) === parentId);
          return { key: `sub-${idOf(sub)}`, kind: 'sub' as const, id: idOf(sub), label: sub.name || 'Subcategoría', icon: sub.icon, color: sub.color, parentId, parentLabel: parent?.name || '' };
        })
        .filter((entry) => entry.parentId),
    [subCategories, categories]
  );

  // Sections for the list: one per letter, each category followed by its sub-categories.
  const sections = useMemo<Section[]>(() => {
    const needle = normalizeText(query);
    if (needle) {
      const cats = catEntries.filter((entry) => normalizeText(entry.label).includes(needle));
      const subs = subEntries.filter((entry) => normalizeText(`${entry.label} ${entry.parentLabel}`).includes(needle)).sort((a, b) => byName(a.label, b.label));
      return [
        ...(cats.length ? [{ title: 'Categorías', data: cats }] : []),
        ...(subs.length ? [{ title: 'Subcategorías', data: subs }] : []),
      ];
    }
    const grouped = new Map<string, Entry[]>();
    for (const category of catEntries) {
      const letter = letterOf(category.label);
      const list = grouped.get(letter) ?? [];
      list.push(category, ...subEntries.filter((sub) => sub.parentId === category.id).sort((a, b) => byName(a.label, b.label)));
      grouped.set(letter, list);
    }
    return [...grouped.entries()].sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b))).map(([title, data]) => ({ title, data }));
  }, [catEntries, subEntries, query]);

  const searching = normalizeText(query) !== '';
  const letterIndex = (letter: string) => sections.findIndex((section) => section.title === letter);

  const chosenLabel = (() => {
    if (value.subCategoryId) return subEntries.find((entry) => entry.id === value.subCategoryId)?.label ?? 'Subcategoría';
    if (value.categoryId) return catEntries.find((entry) => entry.id === value.categoryId)?.label ?? 'Categoría';
    return null;
  })();
  const chosenEntry = value.subCategoryId ? subEntries.find((entry) => entry.id === value.subCategoryId) : catEntries.find((entry) => entry.id === value.categoryId);

  const pick = (entry: Entry) => {
    onChange(entry.kind === 'sub' ? { categoryId: entry.parentId, subCategoryId: entry.id } : { categoryId: entry.id, subCategoryId: '' });
    setOpen(false);
    setQuery('');
  };

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View className="gap-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 24 }}>
        <Chip label={allLabel} selected={!chosenLabel} onPress={() => onChange({ categoryId: '', subCategoryId: '' })} />
        {chosenLabel && chosenEntry && (
          <Chip label={chosenLabel} selected icon={chosenEntry.icon} color={chosenEntry.color} onPress={() => onChange({ categoryId: '', subCategoryId: '' })} />
        )}
        <Chip label={`Ver todas (${categories.length})`} icon="search" onPress={() => setOpen(true)} />
      </ScrollView>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <View style={{ flex: 1, backgroundColor: dark ? DARK_BASE : colors.background }}>
          <AmbientBackground />
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
              <Text className="font-inter-bold text-2xl text-gf-text">Categorías</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={close} hitSlop={10}>
                <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
            </View>
            <View className="px-6 pb-2">
              <TextField label="" value={query} onChangeText={setQuery} onClear={() => setQuery('')} placeholder="Buscar categoría o subcategoría" autoCorrect={false} />
            </View>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <SectionList<Entry, Section>
                ref={listRef}
                sections={sections}
                keyExtractor={(item) => item.key}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingRight: searching ? 24 : 8 }}
                renderSectionHeader={({ section }) => (
                  <Text className="pb-1 pt-4 font-inter-semibold text-sm text-gf-text-muted">{section.title}</Text>
                )}
                ListEmptyComponent={<Text className="pt-6 font-inter text-base text-gf-text-muted">Nada coincide con «{query}».</Text>}
                renderItem={({ item }) => {
                  const selected = item.kind === 'sub' ? value.subCategoryId === item.id : value.categoryId === item.id && !value.subCategoryId;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => pick(item)}
                      className="flex-row items-center gap-3 py-2.5"
                      style={{ paddingLeft: item.kind === 'sub' ? 28 : 0 }}>
                      <CategoryBadge icon={item.icon} color={item.color} size={item.kind === 'sub' ? 32 : 40} />
                      <View className="flex-1">
                        <Text className="font-inter-medium text-base text-gf-text">{item.label}</Text>
                        {item.kind === 'sub' && <Text className="font-inter text-sm text-gf-text-muted">{item.parentLabel}</Text>}
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={24} color={colors.accent} />}
                    </Pressable>
                  );
                }}
              />
              {!searching && (
                <View className="items-center justify-center pr-1">
                  {LETTERS.map((letter) => {
                    const at = letterIndex(letter);
                    return (
                      <Pressable
                        key={letter}
                        accessibilityRole="button"
                        accessibilityLabel={`Ir a ${letter}`}
                        disabled={at < 0}
                        onPress={() => listRef.current?.scrollToLocation({ sectionIndex: at, itemIndex: 0, animated: false, viewOffset: 0 })}
                        hitSlop={4}
                        style={{ paddingVertical: 1 }}>
                        <Text className="font-inter-semibold text-[11px]" style={{ color: at < 0 ? colors.textSecondary : colors.accent, opacity: at < 0 ? 0.35 : 1 }}>
                          {letter}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

function Chip({ label, selected = false, icon, color, onPress }: { label: string; selected?: boolean; icon?: string; color?: string; onPress: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-full border border-gf-border px-4 py-2"
      style={{ backgroundColor: selected ? colors.accentSoft : undefined, borderColor: selected ? colors.accent : undefined }}>
      {icon === 'search' ? <Ionicons name="search" size={16} color={colors.accent} /> : icon ? <CategoryBadge icon={icon} color={color} size={22} /> : null}
      <Text className="font-inter-medium text-sm text-gf-text" numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
