import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { FlatList, PanResponder, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { CategoryBadge } from '@/components/category-badge';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { idOf } from '@gastify/core/categories/categoryForm';
import type { CategoryData } from '@gastify/core/features/categoriesSlice';
import type { SubCategoryData } from '@gastify/core/features/subCategorySlice';
import { normalizeText } from '@gastify/core/search/normalizeText';
import { useT } from "@/i18n/client";

export type CategoryChoice = { categoryId: string; subCategoryId: string };

type Entry = { kind: 'cat' | 'sub'; id: string; label: string; icon?: string; color?: string; parentId: string; parentLabel: string };
type Row = { key: string; type: 'header' | 'cat' | 'sub'; title?: string; entry?: Entry };

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
// Fixed row heights: they let the list jump to any letter without having to measure the rows first.
const HEADER_HEIGHT = 40;
const CAT_HEIGHT = 60;
const SUB_HEIGHT = 52;
const heightOf = (row: Row) => (row.type === 'header' ? HEADER_HEIGHT : row.type === 'cat' ? CAT_HEIGHT : SUB_HEIGHT);

// The first letter of a name, without accents; anything that is not a letter goes under "#".
function letterOf(text: string): string {
  const first = normalizeText(text).charAt(0).toUpperCase();
  return LETTERS.includes(first) ? first : '#';
}

const byName = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true });

// The categories and their sub-categories, the same as the web's picker: the chosen one shows as a chip,
// "Ver todas" opens the full list. In the list the categories are alphabetical, each with its sub-categories
// under it, and the letters on the right can be dragged with a finger (like the contacts list). Searching splits
// the results into categories and sub-categories.
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
  const t = useT();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dragLetter, setDragLetter] = useState<string | null>(null);
  const listRef = useRef<FlatList<Row>>(null);

  const catEntries = useMemo<Entry[]>(
    () =>
      categories
        .map((category) => ({ kind: 'cat' as const, id: idOf(category), label: category.name || 'Categoría', icon: category.icon, color: category.color, parentId: '', parentLabel: '' }))
        .sort((a, b) => byName(a.label, b.label)),
    [categories]
  );
  const subEntries = useMemo<Entry[]>(
    () =>
      subCategories
        .map((sub) => {
          const parentId = idOf(sub.fatherCategory);
          const parent = categories.find((category) => idOf(category) === parentId);
          return { kind: 'sub' as const, id: idOf(sub), label: sub.name || 'Subcategoría', icon: sub.icon, color: sub.color, parentId, parentLabel: parent?.name || '' };
        })
        .filter((entry) => entry.parentId),
    [subCategories, categories]
  );

  const searching = normalizeText(query) !== '';

  // The flat list: letter headers with each category followed by its sub-categories (or, when searching, the
  // two result groups), and where each letter starts.
  const { rows, offsets, letterOffset } = useMemo(() => {
    const flat: Row[] = [];
    const starts = new Map<string, number>();
    const needle = normalizeText(query);
    if (needle) {
      const cats = catEntries.filter((entry) => normalizeText(entry.label).includes(needle));
      const subs = subEntries.filter((entry) => normalizeText(`${entry.label} ${entry.parentLabel}`).includes(needle)).sort((a, b) => byName(a.label, b.label));
      if (cats.length) flat.push({ key: 'h-cats', type: 'header', title: t("mobile.categorias") }, ...cats.map((entry) => ({ key: `cat-${entry.id}`, type: 'cat' as const, entry })));
      if (subs.length) flat.push({ key: 'h-subs', type: 'header', title: t("mobile.subcategorias") }, ...subs.map((entry) => ({ key: `sub-${entry.id}`, type: 'sub' as const, entry })));
    } else {
      for (const category of catEntries) {
        const letter = letterOf(category.label);
        if (!starts.has(letter)) {
          starts.set(letter, -1);
          flat.push({ key: `h-${letter}`, type: 'header', title: letter });
        }
        flat.push({ key: `cat-${category.id}`, type: 'cat', entry: category });
        for (const sub of subEntries.filter((entry) => entry.parentId === category.id).sort((a, b) => byName(a.label, b.label))) {
          flat.push({ key: `sub-${sub.id}`, type: 'sub', entry: sub });
        }
      }
    }
    const offs: number[] = [];
    let at = 0;
    const letterAt = new Map<string, number>();
    for (const row of flat) {
      offs.push(at);
      if (row.type === 'header' && row.title && row.title.length === 1) letterAt.set(row.title, at);
      at += heightOf(row);
    }
    return { rows: flat, offsets: offs, letterOffset: letterAt };
  }, [catEntries, subEntries, query]);

  // Dragging on the rail: the letter under the finger (or the nearest one that has categories) is shown and the
  // list jumps to it.
  const railHeight = useRef(0);
  const jumpTo = (y: number) => {
    if (railHeight.current <= 0) return;
    const index = Math.max(0, Math.min(LETTERS.length - 1, Math.floor((y / railHeight.current) * LETTERS.length)));
    let letter = LETTERS[index];
    if (!letterOffset.has(letter)) {
      const after = LETTERS.slice(index).find((l) => letterOffset.has(l));
      const before = [...LETTERS.slice(0, index)].reverse().find((l) => letterOffset.has(l));
      letter = after ?? before ?? letter;
    }
    const offset = letterOffset.get(letter);
    if (offset === undefined) return;
    setDragLetter(letter);
    listRef.current?.scrollToOffset({ offset, animated: false });
  };
  // PanResponder keeps the callbacks it was created with: this keeps them pointing at the latest list.
  const latestJump = useRef(jumpTo);
  latestJump.current = jumpTo;
  const railHandlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => latestJump.current(event.nativeEvent.locationY),
        onPanResponderMove: (event) => latestJump.current(event.nativeEvent.locationY),
        onPanResponderRelease: () => setDragLetter(null),
        onPanResponderTerminate: () => setDragLetter(null),
      }).panHandlers,
    []
  );

  const chosenEntry = value.subCategoryId ? subEntries.find((entry) => entry.id === value.subCategoryId) : catEntries.find((entry) => entry.id === value.categoryId);
  const chosenLabel = chosenEntry?.label ?? null;

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
        <Chip label={t("mobile.categories.seeAll", { p1: categories.length })} icon="search" onPress={() => setOpen(true)} />
      </ScrollView>

      <BottomSheet visible={open} onClose={close} maxHeight="88%" fill>
        <View style={{ flex: 1 }}>
          <View>
            <View className="flex-row items-center justify-between px-6 pb-2 pt-5">
              <Text className="font-inter-bold text-2xl text-gf-text">{t("mobile.categorias")}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={close} hitSlop={10}>
                <Ionicons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>
            <View className="px-6 pb-2">
              <TextField label="" value={query} onChangeText={setQuery} onClear={() => setQuery('')} placeholder={t("mobile.buscar.categoria.o.subcategoria")} autoCorrect={false} />
            </View>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <FlatList<Row>
                ref={listRef}
                data={rows}
                keyExtractor={(row) => row.key}
                keyboardShouldPersistTaps="handled"
                getItemLayout={(_, index) => ({ length: heightOf(rows[index]), offset: offsets[index], index })}
                contentContainerStyle={{ paddingLeft: 24, paddingRight: searching ? 24 : 8, paddingBottom: 32 }}
                ListEmptyComponent={<Text className="pt-6 font-inter text-base text-gf-text-muted">{t("mobile.nada.coincide.con.p1", { p1: query })}</Text>}
                renderItem={({ item }) => {
                  if (item.type === 'header') {
                    return (
                      <View style={{ height: HEADER_HEIGHT, justifyContent: 'flex-end', paddingBottom: 4 }}>
                        <Text className="font-inter-semibold text-sm text-gf-text-muted">{item.title}</Text>
                      </View>
                    );
                  }
                  const entry = item.entry as Entry;
                  const selected = entry.kind === 'sub' ? value.subCategoryId === entry.id : value.categoryId === entry.id && !value.subCategoryId;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => pick(entry)}
                      className="flex-row items-center gap-3"
                      style={{ height: heightOf(item), paddingLeft: entry.kind === 'sub' ? 28 : 0 }}>
                      <CategoryBadge icon={entry.icon} color={entry.color} size={entry.kind === 'sub' ? 32 : 40} />
                      <View className="flex-1">
                        <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{entry.label}</Text>
                        {entry.kind === 'sub' && <Text className="font-inter text-sm text-gf-text-muted" numberOfLines={1}>{entry.parentLabel}</Text>}
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={24} color={colors.accent} />}
                    </Pressable>
                  );
                }}
              />
              {!searching && (
                <View
                  {...railHandlers}
                  onLayout={(event) => {
                    railHeight.current = event.nativeEvent.layout.height;
                  }}
                  accessibilityLabel={t("mobile.indice.de.letras")}
                  style={{ width: 34, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
                  {LETTERS.map((letter) => (
                    <View key={letter} pointerEvents="none" style={{ alignItems: 'center' }}>
                      <Text
                        className="font-inter-semibold text-[11px]"
                        style={{ color: letterOffset.has(letter) ? colors.accent : colors.textSecondary, opacity: letterOffset.has(letter) ? 1 : 0.35 }}>
                        {letter}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {dragLetter && (
                <View pointerEvents="none" style={{ position: 'absolute', right: 56, top: '40%', width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Text className="font-inter-bold text-3xl" style={{ color: dark ? '#1e1533' : '#ffffff' }}>{dragLetter}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </BottomSheet>
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
      style={{ backgroundColor: selected ? colors.accentSoft : undefined, borderColor: selected ? colors.accent : colors.border }}>
      {icon === 'search' ? <Ionicons name="search" size={16} color={colors.accent} /> : icon ? <CategoryBadge icon={icon} color={color} size={22} /> : null}
      <Text className="font-inter-medium text-sm text-gf-text" numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
