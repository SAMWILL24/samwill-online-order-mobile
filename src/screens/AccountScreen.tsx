import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import type { Order } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { formatCents } from '../lib/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

export function AccountScreen({ navigation }: Props) {
  const { customer, logout } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (customer) api.myOrders().then((res) => setOrders(res.orders));
  }, [customer]);

  if (!customer) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Log in to see your order history.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.primaryBtnText}>Log In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi, {customer.name}</Text>
      <View style={styles.loyaltyBadge}>
        <Text style={styles.loyaltyBadgeText}>⭐ {customer.loyaltyPoints} loyalty points</Text>
      </View>
      <Pressable onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Order history</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        ListEmptyComponent={<Text style={styles.muted}>No past orders yet.</Text>}
        renderItem={({ item: o }) => (
          <Pressable style={styles.orderRow} onPress={() => navigation.navigate('OrderTracking', { orderId: o.id })}>
            <Text>
              Order #{o.id} · {new Date(o.createdAt).toLocaleDateString()}
            </Text>
            <Text>{formatCents(o.totalCents)}</Text>
            <Text style={styles.statusPill}>{o.status}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.text },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 8, color: theme.text },
  muted: { color: theme.textMuted, fontSize: 13 },
  logoutText: { color: theme.error, marginTop: 6 },
  loyaltyBadge: { backgroundColor: theme.accent, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 8 },
  loyaltyBadgeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8,
    paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.border,
  },
  statusPill: { backgroundColor: theme.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11, textTransform: 'capitalize' },
  primaryBtn: { backgroundColor: theme.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
