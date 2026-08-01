import type { MenuItem } from '../types';

export type RootStackParamList = {
  Intro: undefined;
  Menu: undefined;
  ItemModal: { item: MenuItem; supportsHalfAndHalf?: boolean; otherItemsInCategory?: MenuItem[] };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: number };
  Login: undefined;
  Register: undefined;
  Account: undefined;
};
