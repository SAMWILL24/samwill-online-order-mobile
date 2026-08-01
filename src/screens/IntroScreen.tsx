import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import type { RestaurantSettings } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { PromotionsBanner } from '../components/PromotionsBanner';
import { AnnouncementsBanner } from '../components/AnnouncementsBanner';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

function firstEnabledType(s: RestaurantSettings): 'pickup' | 'delivery' | 'curbside' | null {
  if (s.pickupEnabled) return 'pickup';
  if (s.deliveryEnabled) return 'delivery';
  if (s.curbsideEnabled) return 'curbside';
  return null;
}

export function IntroScreen({ navigation }: Props) {
  const { orderType, setOrderType, setRequestedTime } = useApp();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [schedule, setSchedule] = useState<'asap' | 'future'>('asap');
  const [futureTime, setFutureTime] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      const enabledMap = { pickup: s.pickupEnabled, delivery: s.deliveryEnabled, curbside: s.curbsideEnabled };
      if (!enabledMap[orderType]) {
        const fallback = firstEnabledType(s);
        if (fallback) setOrderType(fallback);
      }
      if (s.orderMode === 'asap_only') setSchedule('asap');
      if (s.orderMode === 'advance_only') setSchedule('future');
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleViewMenu() {
    setRequestedTime(schedule === 'asap' ? 'ASAP' : futureTime.toLocaleString());
    navigation.navigate('Menu');
  }

  const hoursToday = orderType === 'delivery' ? settings?.deliveryHoursToday : settings?.pickupHoursToday;

  if (settings && !settings.onlineOrderingEnabled) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{settings.name}</Text>
        <Text style={styles.muted}>Online ordering is currently paused. Please check back soon.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{settings?.name || 'SAMWILL Kitchen'}</Text>
      <Text style={styles.muted}>{settings?.storeDescription || 'Order online for pickup or delivery.'}</Text>

      <AnnouncementsBanner />
      <PromotionsBanner />

      <View style={styles.segmented}>
        {(!settings || settings.pickupEnabled) && (
          <Pressable
            style={[styles.segmentBtn, orderType === 'pickup' && styles.segmentBtnActive]}
            onPress={() => setOrderType('pickup')}
          >
            <Text style={orderType === 'pickup' ? styles.segmentTextActive : styles.segmentText}>Pickup</Text>
          </Pressable>
        )}
        {(!settings || settings.deliveryEnabled) && (
          <Pressable
            style={[styles.segmentBtn, orderType === 'delivery' && styles.segmentBtnActive]}
            onPress={() => setOrderType('delivery')}
          >
            <Text style={orderType === 'delivery' ? styles.segmentTextActive : styles.segmentText}>Delivery</Text>
          </Pressable>
        )}
        {settings?.curbsideEnabled && (
          <Pressable
            style={[styles.segmentBtn, orderType === 'curbside' && styles.segmentBtnActive]}
            onPress={() => setOrderType('curbside')}
          >
            <Text style={orderType === 'curbside' ? styles.segmentTextActive : styles.segmentText}>Curbside</Text>
          </Pressable>
        )}
      </View>

      {hoursToday && (
        <Text style={styles.muted}>
          {orderType === 'delivery' ? 'Delivery' : orderType === 'curbside' ? 'Curbside' : 'Pickup'} hours today: {hoursToday}
        </Text>
      )}
      {orderType === 'delivery' && settings && (
        <Text style={styles.muted}>
          ${(settings.deliveryFeeCents / 100).toFixed(2)} delivery fee · ${(settings.minDeliveryCents / 100).toFixed(2)} minimum
        </Text>
      )}

      {settings?.orderMode !== 'advance_only' && settings?.orderMode !== 'asap_only' && (
        <View style={styles.segmented}>
          <Pressable style={[styles.segmentBtn, schedule === 'asap' && styles.segmentBtnActive]} onPress={() => setSchedule('asap')}>
            <Text style={schedule === 'asap' ? styles.segmentTextActive : styles.segmentText}>ASAP</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, schedule === 'future' && styles.segmentBtnActive]}
            onPress={() => {
              setSchedule('future');
              setShowPicker(true);
            }}
          >
            <Text style={schedule === 'future' ? styles.segmentTextActive : styles.segmentText}>Schedule later</Text>
          </Pressable>
        </View>
      )}

      {schedule === 'future' && Platform.OS !== 'web' && showPicker && (
        <DateTimePicker
          value={futureTime}
          mode="datetime"
          onChange={(_, date) => {
            setShowPicker(false);
            if (date) setFutureTime(date);
          }}
        />
      )}
      {schedule === 'future' && Platform.OS === 'web' && (
        // @ts-expect-error - RNW passes through to a native <input>
        <TextInput style={styles.webDateInput} type="datetime-local" onChange={(e: any) => setFutureTime(new Date(e.target.value))} />
      )}

      <Pressable style={styles.primaryBtn} onPress={handleViewMenu}>
        <Text style={styles.primaryBtnText}>View Menu</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: theme.bg },
  title: { fontSize: 28, fontWeight: '700', color: theme.text, marginTop: 24, marginBottom: 4 },
  muted: { color: theme.textMuted, fontSize: 13, marginVertical: 4, textAlign: 'center' },
  segmented: { flexDirection: 'row', gap: 8, marginVertical: 16, width: '100%' },
  segmentBtn: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  segmentText: { color: theme.text },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  webDateInput: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, marginVertical: 8, width: '100%' },
  primaryBtn: { backgroundColor: theme.accent, borderRadius: 8, paddingVertical: 14, width: '100%', alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
