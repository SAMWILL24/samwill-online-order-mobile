import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import type { Announcement } from '../types';
import { theme } from '../theme';

export function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    api.getActiveAnnouncements().then((res) => setAnnouncements(res.announcements)).catch(() => {});
  }, []);

  if (announcements.length === 0) return null;

  return (
    <View style={styles.container}>
      {announcements.map((a) => (
        <View style={styles.strip} key={a.id}>
          <Text style={styles.text}>{a.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 8, marginVertical: 12 },
  strip: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.accent, borderRadius: 8, padding: 12 },
  text: { color: theme.text, fontSize: 13 },
});
