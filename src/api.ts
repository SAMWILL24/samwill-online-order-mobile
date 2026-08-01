import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Announcement, Customer, MenuCategory, Order, Promotion, RestaurantSettings } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL as string;
const STORE_SLUG = process.env.EXPO_PUBLIC_STORE_SLUG as string;

async function authHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('customerToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api/${STORE_SLUG}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export const api = {
  getMenu: () => request<{ categories: MenuCategory[] }>('/menu'),
  getSettings: () => request<RestaurantSettings>('/settings'),
  getActivePromotions: () => request<{ promotions: Promotion[] }>('/promotions/active'),
  getActiveAnnouncements: () => request<{ announcements: Announcement[] }>('/announcements/active'),

  register: (email: string, password: string, name: string, phone?: string) =>
    request<{ token: string; customer: Customer }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, phone }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; customer: Customer }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ customer: Customer }>('/auth/me'),

  createOrder: (payload: unknown) =>
    request<{ order: Order; payment: { charged: boolean; note?: string } }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getOrder: (id: number) => request<{ order: Order }>(`/orders/${id}`),
  myOrders: () => request<{ orders: Order[] }>('/orders/mine'),
};

export { API_URL };
