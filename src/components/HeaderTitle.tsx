import { Image, Text, View } from 'react-native';
import { theme } from '../theme';

export function HeaderTitle({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image source={require('../../assets/logo.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
      <Text style={{ fontWeight: '700', fontSize: 17, color: theme.text }}>{title}</Text>
    </View>
  );
}
