import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { io } from 'socket.io-client';
import { api, API_URL } from '../api';
import type { Order } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { formatCents } from '../lib/money';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTracking'>;

const STATUS_STEPS = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'];

export function OrderTrackingScreen({ route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;

    api
      .getOrder(orderId)
      .then((res) => {
        setOrder(res.order);
        socket = io(API_URL, { transports: ['websocket'] });
        socket.on('connect', () => socket!.emit('join-order', { storeId: res.order.storeId, orderId }));
        socket.on('order:update', (updated: Order) => {
          if (updated.id === orderId) setOrder(updated);
        });
      })
      .catch((err) => setError(err.message));

    return () => {
      socket?.disconnect();
    };
  }, [orderId]);

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading order…</Text>
      </View>
    );
  }

  const activeIndex = STATUS_STEPS.indexOf(order.status);
  const relevantSteps = order.type === 'delivery' ? STATUS_STEPS : STATUS_STEPS.filter((s) => s !== 'out_for_delivery');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Order #{order.id}</Text>
      <Text style={styles.muted}>
        {order.type === 'delivery' ? 'Delivery' : order.type === 'curbside' ? 'Curbside' : 'Pickup'} · requested {order.requestedTime}
      </Text>

      {order.status === 'cancelled' ? (
        <Text style={styles.error}>This order was cancelled.</Text>
      ) : (
        <View style={styles.timeline}>
          {relevantSteps.map((step, i) => (
            <View key={step} style={[styles.step, i <= activeIndex && styles.stepDone]}>
              <Text style={[styles.stepText, i <= activeIndex && styles.stepTextDone]}>{step.replaceAll('_', ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.summary}>
        {order.items.map((item, i) => (
          <View style={styles.summaryRow} key={i}>
            <Text style={{ flex: 1 }}>
              {item.quantity}x{' '}
              {item.isHalfAndHalf ? `Half ${item.menuItemName} / Half ${item.secondMenuItemName}` : item.menuItemName} (
              {item.sizeLabel})
              {item.extras.length > 0 && (
                <Text style={styles.muted}>
                  {' '}
                  + {item.extras.map((e) => (item.isHalfAndHalf ? `${e.name} (${e.half})` : e.name)).join(', ')}
                </Text>
              )}
            </Text>
            <Text>{formatCents(item.unitPriceCents * item.quantity)}</Text>
          </View>
        ))}
        <View style={styles.summaryRow}>
          <Text>Subtotal</Text>
          <Text>{formatCents(order.subtotalCents)}</Text>
        </View>
        {order.promotionDiscountCents > 0 && (
          <View style={styles.summaryRow}>
            <Text>Discount{order.promotion ? ` (${order.promotion.title})` : ''}</Text>
            <Text>-{formatCents(order.promotionDiscountCents)}</Text>
          </View>
        )}
        {order.loyaltyRedeemCents > 0 && (
          <View style={styles.summaryRow}>
            <Text>Loyalty points redeemed ({order.loyaltyPointsRedeemed})</Text>
            <Text>-{formatCents(order.loyaltyRedeemCents)}</Text>
          </View>
        )}
        {order.deliveryFeeCents > 0 && (
          <View style={styles.summaryRow}>
            <Text>Delivery fee</Text>
            <Text>{formatCents(order.deliveryFeeCents)}</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text>Tax</Text>
          <Text>{formatCents(order.taxCents)}</Text>
        </View>
        {order.tipCents > 0 && (
          <View style={styles.summaryRow}>
            <Text>Tip</Text>
            <Text>{formatCents(order.tipCents)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>{formatCents(order.totalCents)}</Text>
        </View>
        {order.loyaltyPointsEarned > 0 && (
          <Text style={[styles.muted, { marginTop: 8 }]}>You earned {order.loyaltyPointsEarned} loyalty points on this order.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: theme.text },
  muted: { color: theme.textMuted, fontSize: 13 },
  error: { color: theme.error, padding: 20 },
  timeline: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  step: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.border },
  stepDone: { backgroundColor: theme.accent },
  stepText: { fontSize: 12, color: theme.textMuted, textTransform: 'capitalize' },
  stepTextDone: { color: '#fff' },
  summary: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: theme.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalRow: { borderTopWidth: 1, borderColor: theme.border, marginTop: 6, paddingTop: 8 },
  totalText: { fontWeight: '700', fontSize: 16, color: theme.text },
});
