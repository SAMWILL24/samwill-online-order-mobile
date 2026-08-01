import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import type { Promotion } from '../types';
import { theme } from '../theme';

export function PromotionsBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    api.getActivePromotions().then((res) => setPromotions(res.promotions)).catch(() => {});
  }, []);

  if (promotions.length === 0) return null;

  return (
    <View style={styles.container}>
      {promotions.map((p) => (
        <View style={styles.card} key={p.id}>
          <Text style={styles.title}>{p.title}</Text>
          {p.description && <Text style={styles.desc}>{p.description}</Text>}
          {p.requiresCode && p.code && (
            <View style={styles.codePill}>
              <Text style={styles.codeText}>Use code: {p.code}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 8, marginVertical: 12 },
  card: { backgroundColor: theme.accent, borderRadius: 10, padding: 14 },
  title: { color: '#fff', fontWeight: '700' },
  desc: { color: '#fff', fontSize: 13, opacity: 0.9, marginTop: 2 },
  codePill: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  codeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
