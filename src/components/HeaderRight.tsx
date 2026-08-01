import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export function HeaderRight() {
  const { cart, customer } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
      <Pressable onPress={() => navigation.navigate(customer ? 'Account' : 'Login')}>
        <Text style={{ color: theme.accent, fontWeight: '600' }}>{customer ? customer.name.split(' ')[0] : 'Log in'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Cart')}>
        <Text style={{ color: theme.accent, fontWeight: '600' }}>Cart{itemCount > 0 ? ` (${itemCount})` : ''}</Text>
      </Pressable>
    </View>
  );
}
