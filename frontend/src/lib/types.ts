/**
 * Общие типы, соответствующие сущностям и DTO бэкенда.
 * В будущей итерации можно вынести в shared-пакет монорепо.
 */

export type Role = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Address {
  id: string;
  userId: string;
  label: string | null;
  street: string;
  building: string;
  apt: string | null;
  floor: string | null;
  entrance: string | null;
  comment: string | null;
  isDefault: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sortOrder: number;
}

export type ImageType =
  | 'PIZZA'
  | 'BURGER'
  | 'SALAD'
  | 'SOUP'
  | 'DRINK'
  | 'DESSERT'
  | 'SNACK'
  | 'OTHER';

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: string; // Decimal приходит строкой из JSON
  isDefault: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageType: ImageType;
  categoryId: string;
  isVegan: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  basePrice: string;
  weight: number | null;
  kcal: number | null;
  sortOrder: number;
  category?: { id: string; name: string; slug: string };
  variants: ProductVariant[];
}

// ── Конструктор пиццы ────────────────────────────────────────────────────────
export interface PizzaSize {
  id: string;
  name: string;
  basePrice: string;
  maxIngredients: number;
  sortOrder: number;
}

export interface DoughOption {
  id: string;
  type: 'TRADITIONAL' | 'THIN';
  name: string;
  price: string;
}

export interface Sauce {
  id: string;
  name: string;
  price: string;
  sortOrder: number;
}

export interface Ingredient {
  id: string;
  name: string;
  price: string;
  isVegan: boolean;
  isSpicy: boolean;
}

export interface PizzaOptions {
  sizes: PizzaSize[];
  dough: DoughOption[];
  sauces: Sauce[];
  ingredients: Ingredient[];
}

// ── Заказы ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'COOKING'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELED';

export type PaymentMethod = 'CASH' | 'CARD_ON_DELIVERY';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  unitPrice: string;
  quantity: number;
  configSummary: string | null;
}

export interface Order {
  id: string;
  publicNumber: number;
  userId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  street: string;
  building: string;
  apt: string | null;
  floor: string | null;
  entrance: string | null;
  addressComment: string | null;
  comment: string | null;
  deliveryCost: string;
  itemsTotal: string;
  total: string;
  statusUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderStatusInfo {
  id: string;
  publicNumber: number;
  status: OrderStatus;
  statusUpdatedAt: string;
  total: string;
  paymentMethod: PaymentMethod;
}
