import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import type { RestaurantSettings } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { formatCents } from '../lib/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { cart, updateQuantity, removeFromCart, orderType } = useApp();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const subtotalCents = cart.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const deliveryFeeCents = orderType === 'delivery' ? settings?.deliveryFeeCents || 0 : 0;
  const taxCents = settings ? Math.round(subtotalCents * (settings.taxRateBps / 10000)) : 0;
  const estimatedTotal = subtotalCents + deliveryFeeCents + taxCents;
  const belowMinimum = orderType === 'delivery' && settings && subtotalCents < settings.minDeliveryCents && cart.length > 0;

  if (cart.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Your cart is empty.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.primaryBtnText}>Browse the menu</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(l) => l.key}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: line }) => (
          <View style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineName}>
                {line.halfAndHalf ? `Half ${line.menuItemName} / Half ${line.halfAndHalf.secondMenuItemName}` : line.menuItemName} (
                {line.sizeLabel})
              </Text>
              {line.halfAndHalf && line.halfAndHalf.extras.length > 0 && (
                <Text style={styles.muted}>{line.halfAndHalf.extras.map((e) => `${e.name} (${e.half})`).join(', ')}</Text>
              )}
              {!line.halfAndHalf && line.extras.length > 0 && (
                <Text style={styles.muted}>{line.extras.map((e) => e.name).join(', ')}</Text>
              )}
              {line.notes ? <Text style={styles.muted}>Note: {line.notes}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={styles.qtyRow}>
                <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(line.key, line.quantity - 1)}>
                  <Text>-</Text>
                </Pressable>
                <Text>{line.quantity}</Text>
                <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(line.key, line.quantity + 1)}>
                  <Text>+</Text>
                </Pressable>
              </View>
              <Text style={styles.linePrice}>{formatCents(line.unitPriceCents * line.quantity)}</Text>
              <Pressable onPress={() => removeFromCart(line.key)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text>Subtotal</Text>
              <Text>{formatCents(subtotalCents)}</Text>
            </View>
            {orderType === 'delivery' && (
              <View style={styles.summaryRow}>
                <Text>Delivery fee</Text>
                <Text>{formatCents(deliveryFeeCents)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text>Estimated tax</Text>
              <Text>{formatCents(taxCents)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalText}>Estimated total</Text>
              <Text style={styles.totalText}>{formatCents(estimatedTotal)}</Text>
            </View>
            {belowMinimum && settings && (
              <Text style={styles.error}>Delivery orders require a minimum of {formatCents(settings.minDeliveryCents)}.</Text>
            )}
            <Pressable
              style={[styles.primaryBtn, belowMinimum && styles.primaryBtnDisabled]}
              disabled={Boolean(belowMinimum)}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.primaryBtnText}>Checkout</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  muted: { color: theme.textMuted, fontSize: 13 },
  error: { color: theme.error, fontSize: 13, marginTop: 8 },
  line: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12, backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 12, marginBottom: 10,
  },
  lineName: { fontWeight: '600', color: theme.text, marginBottom: 2 },
  linePrice: { fontWeight: '600', color: theme.text },
  removeText: { color: theme.error, fontSize: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  summary: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: theme.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalRow: { borderTopWidth: 1, borderColor: theme.border, marginTop: 6, paddingTop: 8 },
  totalText: { fontWeight: '700', fontSize: 16, color: theme.text },
  primaryBtn: { backgroundColor: theme.accent, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
