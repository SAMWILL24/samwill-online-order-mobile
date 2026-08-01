import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CartLine, Customer, DeliveryAddress } from '../types';
import { api } from '../api';

type OrderType = 'pickup' | 'delivery' | 'curbside';

interface AppState {
  hydrated: boolean;
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
  requestedTime: string;
  setRequestedTime: (t: string) => void;
  cart: CartLine[];
  addToCart: (line: Omit<CartLine, 'key'>) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  deliveryAddress: DeliveryAddress | null;
  setDeliveryAddress: (a: DeliveryAddress | null) => void;
  customer: Customer | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [orderType, setOrderTypeState] = useState<OrderType>('pickup');
  const [requestedTime, setRequestedTimeState] = useState<string>('ASAP');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [deliveryAddress, setDeliveryAddressState] = useState<DeliveryAddress | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      const [ot, rt, c, addr, cust, tok] = await Promise.all([
        AsyncStorage.getItem('orderType'),
        AsyncStorage.getItem('requestedTime'),
        AsyncStorage.getItem('cart'),
        AsyncStorage.getItem('deliveryAddress'),
        AsyncStorage.getItem('customer'),
        AsyncStorage.getItem('customerToken'),
      ]);
      if (ot) setOrderTypeState(JSON.parse(ot));
      if (rt) setRequestedTimeState(JSON.parse(rt));
      if (c) setCart(JSON.parse(c));
      if (addr) setDeliveryAddressState(JSON.parse(addr));
      if (cust) setCustomer(JSON.parse(cust));
      if (tok) setToken(tok);
      loaded.current = true;
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem('orderType', JSON.stringify(orderType));
  }, [orderType]);
  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem('requestedTime', JSON.stringify(requestedTime));
  }, [requestedTime]);
  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem('deliveryAddress', JSON.stringify(deliveryAddress));
  }, [deliveryAddress]);
  useEffect(() => {
    if (!loaded.current) return;
    if (customer) AsyncStorage.setItem('customer', JSON.stringify(customer));
    else AsyncStorage.removeItem('customer');
  }, [customer]);

  const addToCart: AppState['addToCart'] = (line) => {
    const key = `${line.menuItemId}-${line.sizeId}-${line.extras.map((e) => e.id).sort().join('.')}-${line.notes}-${Date.now()}`;
    setCart((prev) => [...prev, { ...line, key }]);
  };
  const updateQuantity = (key: string, quantity: number) => {
    setCart((prev) => (quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity } : l))));
  };
  const removeFromCart = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key));
  const clearCart = () => setCart([]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setCustomer(res.customer);
    await AsyncStorage.setItem('customerToken', res.token);
  };
  const register = async (email: string, password: string, name: string, phone?: string) => {
    const res = await api.register(email, password, name, phone);
    setToken(res.token);
    setCustomer(res.customer);
    await AsyncStorage.setItem('customerToken', res.token);
  };
  const logout = () => {
    setToken(null);
    setCustomer(null);
    AsyncStorage.removeItem('customerToken');
  };

  const value = useMemo<AppState>(
    () => ({
      hydrated,
      orderType,
      setOrderType: setOrderTypeState,
      requestedTime,
      setRequestedTime: setRequestedTimeState,
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      deliveryAddress,
      setDeliveryAddress: setDeliveryAddressState,
      customer,
      token,
      login,
      register,
      logout,
    }),
    [hydrated, orderType, requestedTime, cart, deliveryAddress, customer, token]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
