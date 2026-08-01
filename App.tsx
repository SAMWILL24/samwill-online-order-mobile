import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { HeaderRight } from './src/components/HeaderRight';
import { HeaderTitle } from './src/components/HeaderTitle';
import type { RootStackParamList } from './src/navigation/types';
import { theme } from './src/theme';

import { IntroScreen } from './src/screens/IntroScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { ItemModalScreen } from './src/screens/ItemModalScreen';
import { CartScreen } from './src/screens/CartScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { OrderTrackingScreen } from './src/screens/OrderTrackingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { AccountScreen } from './src/screens/AccountScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { hydrated } = useApp();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.surface },
          headerTitleStyle: { color: theme.text },
          headerTitle: (props) => <HeaderTitle title={typeof props.children === 'string' ? props.children : ''} />,
          headerRight: () => <HeaderRight />,
        }}
      >
        <Stack.Screen name="Intro" component={IntroScreen} options={{ title: 'SAMWILL Kitchen' }} />
        <Stack.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu' }} />
        <Stack.Screen name="ItemModal" component={ItemModalScreen} options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Order Status' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log In' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
        <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Navigation />
    </AppProvider>
  );
}
