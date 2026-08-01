import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import type { RootStackParamList } from '../navigation/types';
import type { RestaurantSettings } from '../types';
import { theme } from '../theme';
import { formatCents } from '../lib/money';
import { CardPointeTokenizer } from '../components/CardPointeTokenizer';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const TIP_PRESETS = [0, 10, 15, 20];

export function CheckoutScreen({ navigation }: Props) {
  const { cart, orderType, requestedTime, customer, clearCart } = useApp();

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', zip: '' });
  const [tipPercent, setTipPercent] = useState(15);
  const [notes, setNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [redeemPoints, setRedeemPoints] = useState('0');
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cardToken, setCardToken] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const subtotalCents = cart.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const tipCents = Math.round((subtotalCents * tipPercent) / 100);
  const redeemPointsNum = Math.max(0, Math.min(customer?.loyaltyPoints || 0, parseInt(redeemPoints, 10) || 0));
  const canRedeem = Boolean(customer && settings && customer.loyaltyPoints >= settings.loyaltyMinRedeemPoints);
  const redeemValueCents = settings ? Math.round(redeemPointsNum * settings.loyaltyRedeemValueCents) : 0;
  const cardRequired = Boolean(settings?.cardpointeConfigured);

  async function handlePlaceOrder() {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        type: orderType,
        requestedTime,
        tipCents,
        notes,
        promoCode: promoCode.trim() || undefined,
        redeemPoints: redeemPointsNum > 0 ? redeemPointsNum : undefined,
        cart: cart.map((l) => ({
          menuItemId: l.menuItemId,
          sizeId: l.sizeId,
          quantity: l.quantity,
          extraIds: l.extras.map((e) => e.id),
          notes: l.notes,
          ...(l.halfAndHalf
            ? {
                halfAndHalf: {
                  secondMenuItemId: l.halfAndHalf.secondMenuItemId,
                  extras: l.halfAndHalf.extras.map((e) => ({ extraId: e.id, half: e.half })),
                },
              }
            : {}),
        })),
        ...(customer ? {} : { guest: { name: guestName, email: guestEmail, phone: guestPhone } }),
        ...(orderType === 'delivery' ? { address } : {}),
        ...(cardToken ? { cardToken } : {}),
      };
      const res = await api.createOrder(payload);

      clearCart();
      navigation.replace('OrderTracking', { orderId: res.order.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Your cart is empty.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Checkout</Text>

      {!customer && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Your info</Text>
          <TextInput style={styles.input} placeholder="Full name" value={guestName} onChangeText={setGuestName} />
          <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={guestEmail} onChangeText={setGuestEmail} />
          <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={guestPhone} onChangeText={setGuestPhone} />
        </View>
      )}

      {orderType === 'delivery' && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Delivery address</Text>
          <TextInput style={styles.input} placeholder="Address line 1" value={address.line1} onChangeText={(v) => setAddress({ ...address, line1: v })} />
          <TextInput style={styles.input} placeholder="Apt / suite (optional)" value={address.line2} onChangeText={(v) => setAddress({ ...address, line2: v })} />
          <TextInput style={styles.input} placeholder="City" value={address.city} onChangeText={(v) => setAddress({ ...address, city: v })} />
          <TextInput style={styles.input} placeholder="State" value={address.state} onChangeText={(v) => setAddress({ ...address, state: v })} />
          <TextInput style={styles.input} placeholder="ZIP" value={address.zip} onChangeText={(v) => setAddress({ ...address, zip: v })} />
        </View>
      )}

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Tip</Text>
        <View style={styles.segmented}>
          {TIP_PRESETS.map((p) => (
            <Pressable key={p} style={[styles.segmentBtn, tipPercent === p && styles.segmentBtnActive]} onPress={() => setTipPercent(p)}>
              <Text style={tipPercent === p ? styles.segmentTextActive : styles.segmentText}>{p}%</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.muted}>Tip: {formatCents(tipCents)}</Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Promo code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter promo code (optional)"
          autoCapitalize="characters"
          value={promoCode}
          onChangeText={setPromoCode}
        />
      </View>

      {canRedeem && settings && customer && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Redeem loyalty points</Text>
          <Text style={styles.muted}>
            You have {customer.loyaltyPoints} points ({formatCents(Math.round(customer.loyaltyPoints * settings.loyaltyRedeemValueCents))} value).
          </Text>
          <TextInput
            style={styles.input}
            placeholder={`Points to redeem (min ${settings.loyaltyMinRedeemPoints})`}
            keyboardType="number-pad"
            value={redeemPoints}
            onChangeText={setRedeemPoints}
          />
          {redeemPointsNum > 0 && (
            <Text style={styles.muted}>Redeeming {redeemPointsNum} points = {formatCents(redeemValueCents)} off</Text>
          )}
        </View>
      )}

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Order notes</Text>
        <TextInput style={styles.textArea} multiline value={notes} onChangeText={setNotes} placeholder="Anything we should know?" />
      </View>

      {cardRequired && settings?.cardpointeSite && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Card details</Text>
          <CardPointeTokenizer site={settings.cardpointeSite} testMode={settings.cardpointeTestMode} onToken={setCardToken} />
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
      {!cardRequired && <Text style={styles.muted}>Payments are not configured for this store — order will be created without payment processing.</Text>}

      <Pressable style={styles.primaryBtn} disabled={submitting || (cardRequired && !cardToken)} onPress={handlePlaceOrder}>
        <Text style={styles.primaryBtnText}>{submitting ? 'Placing order…' : 'Pay & Place Order'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 8 },
  muted: { color: theme.textMuted, fontSize: 13 },
  error: { color: theme.error, fontSize: 13, marginVertical: 8 },
  group: { marginTop: 18 },
  groupTitle: { fontSize: 12, textTransform: 'uppercase', color: theme.textMuted, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: theme.surface, color: theme.text },
  textArea: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, minHeight: 60, backgroundColor: theme.surface, color: theme.text },
  segmented: { flexDirection: 'row', gap: 8 },
  segmentBtn: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  segmentText: { color: theme.text },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  primaryBtn: { backgroundColor: theme.accent, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
