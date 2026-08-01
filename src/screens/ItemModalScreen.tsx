import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { ExtraHalf } from '../types';
import { useApp } from '../context/AppContext';
import { formatCents } from '../lib/money';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemModal'>;

const HALF_OPTIONS: ExtraHalf[] = ['left', 'whole', 'right'];
const HALF_LABELS: Record<ExtraHalf, string> = { left: 'Left', whole: 'Whole', right: 'Right' };

export function ItemModalScreen({ route, navigation }: Props) {
  const { item, supportsHalfAndHalf, otherItemsInCategory = [] } = route.params;
  const { addToCart } = useApp();
  const [sizeId, setSizeId] = useState<number>(item.sizes[0]?.id);
  const [selectedExtras, setSelectedExtras] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false);
  const [secondItemId, setSecondItemId] = useState<number | undefined>(otherItemsInCategory[0]?.id);
  const [placements, setPlacements] = useState<Record<number, ExtraHalf>>({});

  const secondItem = otherItemsInCategory.find((i) => i.id === secondItemId);
  const size = item.sizes.find((s) => s.id === sizeId)!;
  const secondSize = secondItem?.sizes.find((s) => s.label === size?.label);

  function toggleExtra(groupId: number, extraId: number, max: number) {
    setSelectedExtras((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(extraId)) return { ...prev, [groupId]: current.filter((id) => id !== extraId) };
      if (max === 1) return { ...prev, [groupId]: [extraId] };
      if (current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, extraId] };
    });
  }

  function setPlacement(extraId: number, half: ExtraHalf | null) {
    setPlacements((prev) => {
      const next = { ...prev };
      if (half === null) delete next[extraId];
      else next[extraId] = half;
      return next;
    });
  }

  const groupErrors = useMemo(() => {
    if (isHalfAndHalf) {
      return item.extraGroups.filter((g) => {
        const groupExtraIds = new Set(g.extras.map((e) => e.id));
        let leftCount = 0;
        let rightCount = 0;
        for (const [idStr, half] of Object.entries(placements)) {
          if (!groupExtraIds.has(Number(idStr))) continue;
          if (half === 'left' || half === 'whole') leftCount++;
          if (half === 'right' || half === 'whole') rightCount++;
        }
        return leftCount < g.minSelect || leftCount > g.maxSelect || rightCount < g.minSelect || rightCount > g.maxSelect;
      });
    }
    return item.extraGroups.filter((g) => {
      const count = (selectedExtras[g.id] || []).length;
      return count < g.minSelect || count > g.maxSelect;
    });
  }, [item.extraGroups, selectedExtras, placements, isHalfAndHalf]);

  const chosenExtras = item.extraGroups.flatMap((g) => (selectedExtras[g.id] || []).map((id) => g.extras.find((e) => e.id === id)!));

  const halfPlacementExtras = useMemo(() => {
    const allExtras = item.extraGroups.flatMap((g) => g.extras);
    return Object.entries(placements).map(([idStr, half]) => {
      const extra = allExtras.find((e) => e.id === Number(idStr))!;
      const priceCents = half === 'whole' ? extra.priceCents : Math.round(extra.priceCents / 2);
      return { id: extra.id, name: extra.name, half, priceCents };
    });
  }, [placements, item.extraGroups]);

  const basePriceCents = isHalfAndHalf ? Math.max(size?.priceCents || 0, secondSize?.priceCents || 0) : size?.priceCents || 0;
  const extrasTotalCents = isHalfAndHalf
    ? halfPlacementExtras.reduce((sum, e) => sum + e.priceCents, 0)
    : chosenExtras.reduce((sum, e) => sum + e.priceCents, 0);
  const unitPriceCents = basePriceCents + extrasTotalCents;

  const canSubmit = Boolean(size) && groupErrors.length === 0 && (!isHalfAndHalf || (Boolean(secondItem) && Boolean(secondSize)));

  function handleAdd() {
    if (!canSubmit) return;
    if (isHalfAndHalf && secondItem && secondSize) {
      addToCart({
        menuItemId: item.id,
        menuItemName: item.name,
        sizeId: size.id,
        sizeLabel: size.label,
        quantity,
        extras: [],
        notes,
        unitPriceCents,
        halfAndHalf: { secondMenuItemId: secondItem.id, secondMenuItemName: secondItem.name, extras: halfPlacementExtras },
      });
    } else {
      addToCart({
        menuItemId: item.id,
        menuItemName: item.name,
        sizeId: size.id,
        sizeLabel: size.label,
        quantity,
        extras: chosenExtras.map((e) => ({ id: e.id, name: e.name, priceCents: e.priceCents })),
        notes,
        unitPriceCents,
      });
    }
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.heroImage} />}
      <Text style={styles.title}>{item.name}</Text>
      {item.description && <Text style={styles.muted}>{item.description}</Text>}

      {item.sizes.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Size</Text>
          {item.sizes.map((s) => (
            <Pressable key={s.id} style={styles.optionRow} onPress={() => setSizeId(s.id)}>
              <View style={[styles.radio, sizeId === s.id && styles.radioActive]} />
              <Text style={styles.optionText}>
                {s.label} — {formatCents(s.priceCents)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {supportsHalfAndHalf && otherItemsInCategory.length > 0 && (
        <View style={styles.group}>
          <View style={styles.optionRow}>
            <Switch value={isHalfAndHalf} onValueChange={setIsHalfAndHalf} />
            <Text style={styles.optionText}>Make it Half &amp; Half</Text>
          </View>
          {isHalfAndHalf && (
            <>
              <Text style={styles.groupTitle}>Other half</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {otherItemsInCategory.map((i) => (
                  <Pressable
                    key={i.id}
                    style={[styles.chip, secondItemId === i.id && styles.chipActive]}
                    onPress={() => setSecondItemId(i.id)}
                  >
                    <Text style={secondItemId === i.id ? styles.chipTextActive : styles.chipText}>{i.name}</Text>
                  </Pressable>
                ))}
              </View>
              {secondItem && !secondSize && (
                <Text style={styles.error}>
                  {secondItem.name} isn't available in size {size?.label}.
                </Text>
              )}
            </>
          )}
        </View>
      )}

      {!isHalfAndHalf &&
        item.extraGroups.map((g) => (
          <View style={styles.group} key={g.id}>
            <Text style={styles.groupTitle}>
              {g.name} (choose {g.minSelect === g.maxSelect ? g.minSelect : `${g.minSelect}-${g.maxSelect}`})
            </Text>
            {g.extras.map((e) => {
              const checked = (selectedExtras[g.id] || []).includes(e.id);
              return (
                <Pressable key={e.id} style={styles.optionRow} onPress={() => toggleExtra(g.id, e.id, g.maxSelect)}>
                  <View style={[g.maxSelect === 1 ? styles.radio : styles.checkbox, checked && styles.radioActive]} />
                  <Text style={styles.optionText}>
                    {e.name} {e.priceCents > 0 && `+${formatCents(e.priceCents)}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}

      {isHalfAndHalf &&
        item.extraGroups.map((g) => (
          <View style={styles.group} key={g.id}>
            <Text style={styles.groupTitle}>
              {g.name} (pick {g.minSelect}-{g.maxSelect} per half)
            </Text>
            {g.extras.map((e) => (
              <View key={e.id} style={styles.halfExtraRow}>
                <Text style={styles.optionText}>
                  {e.name} {e.priceCents > 0 && `+${formatCents(e.priceCents)}`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {HALF_OPTIONS.map((half) => (
                    <Pressable
                      key={half}
                      style={[styles.halfBtn, placements[e.id] === half && styles.halfBtnActive]}
                      onPress={() => setPlacement(e.id, placements[e.id] === half ? null : half)}
                    >
                      <Text style={placements[e.id] === half ? styles.chipTextActive : styles.chipText}>
                        {HALF_LABELS[half]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Notes</Text>
        <TextInput
          style={styles.textArea}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Special instructions"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.qtyRow}>
        <Pressable style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
          <Text style={styles.qtyBtnText}>-</Text>
        </Pressable>
        <Text style={styles.qtyValue}>{quantity}</Text>
        <Pressable style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]} disabled={!canSubmit} onPress={handleAdd}>
        <Text style={styles.primaryBtnText}>Add to Cart · {formatCents(unitPriceCents * quantity)}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  heroImage: { width: '100%', height: 160, borderRadius: 10, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.text },
  muted: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
  error: { color: theme.error, fontSize: 13, marginTop: 4 },
  group: { marginTop: 20 },
  groupTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.textMuted, marginBottom: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  optionText: { color: theme.text, fontSize: 15 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme.border },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: theme.border },
  radioActive: { borderColor: theme.accent, backgroundColor: theme.accent },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.bg },
  chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipText: { color: theme.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontSize: 13, fontWeight: '600' },
  halfExtraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 10,
  },
  halfBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.bg },
  halfBtnActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  textArea: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, minHeight: 60, color: theme.text },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 20 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, color: theme.text },
  qtyValue: { fontSize: 16, fontWeight: '600', color: theme.text, minWidth: 20, textAlign: 'center' },
  primaryBtn: { backgroundColor: theme.accent, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
