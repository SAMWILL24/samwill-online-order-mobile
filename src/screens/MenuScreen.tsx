import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api';
import type { MenuCategory } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { formatCents } from '../lib/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

export function MenuScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMenu()
      .then((data) => {
        setCategories(data.categories);
        setActiveCategory(data.categories[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading menu…</Text>
      </View>
    );
  }

  const current = categories.find((c) => c.id === activeCategory);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={{ gap: 8 }}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.tab, activeCategory === cat.id && styles.tabActive]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text style={activeCategory === cat.id ? styles.tabTextActive : styles.tabText}>{cat.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={current?.items || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.itemCard}
            onPress={() =>
              navigation.navigate('ItemModal', {
                item,
                supportsHalfAndHalf: current?.supportsHalfAndHalf,
                otherItemsInCategory: current?.items.filter((i) => i.id !== item.id),
              })
            }
          >
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description && <Text style={styles.muted}>{item.description}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {item.sizes.map((s) => (
                <Text key={s.id} style={styles.sizeChip}>
                  {s.label} {formatCents(s.priceCents)}
                </Text>
              ))}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.textMuted, fontSize: 13 },
  tabs: { flexGrow: 0, paddingHorizontal: 16, paddingVertical: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  tabActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  tabText: { color: theme.text },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 14,
  },
  itemThumb: { width: 56, height: 56, borderRadius: 8 },
  itemName: { fontWeight: '600', fontSize: 15, color: theme.text, marginBottom: 2 },
  sizeChip: { fontSize: 12, color: theme.textMuted },
});
