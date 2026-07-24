import { api, setToken } from './api-client';
import type {
  Address,
  AuthResponse,
  Category,
  Order,
  OrderStatus,
  OrderStatusInfo,
  PizzaOptions,
  Product,
} from './types';

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name?: string; phone?: string }) =>
    api.post('auth/register', { json: data }).json<AuthResponse>(),
  login: (data: { email: string; password: string }) =>
    api.post('auth/login', { json: data }).json<AuthResponse>(),
  me: () => api.get('auth/me').json(),
};

// Сохраняем токен после login/register.
export async function signIn(data: { email: string; password: string }) {
  const res = await authApi.login(data);
  setToken(res.accessToken);
  return res;
}
export async function signUp(data: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}) {
  const res = await authApi.register(data);
  setToken(res.accessToken);
  return res;
}
export function signOut() {
  setToken(null);
}

// ── Catalog ─────────────────────────────────────────────────────────────────
export interface ProductFilters {
  category?: string;
  q?: string;
  vegan?: boolean;
  spicy?: boolean;
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'name';
}

export const catalogApi = {
  categories: () => api.get('categories').json<Category[]>(),
  products: (filters: ProductFilters = {}) => {
    const search = Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== '' && v !== false)
      .reduce<Record<string, string>>((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {});
    return api.get('products', { searchParams: search }).json<Product[]>();
  },
  featured: (limit = 8) =>
    api.get('products/featured', { searchParams: limit ? { limit: String(limit) } : {} }).json<Product[]>(),
  bySlug: (slug: string) => api.get(`products/${slug}`).json<Product>(),
};

// ── Pizza builder ────────────────────────────────────────────────────────────
export const pizzaApi = {
  options: () => api.get('pizza/options').json<PizzaOptions>(),
};

// ── Users / addresses ────────────────────────────────────────────────────────
export const usersApi = {
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.patch('users/me', { json: data }).json(),
  addresses: () => api.get('users/me/addresses').json<Address[]>(),
  createAddress: (data: Omit<Address, 'id' | 'userId' | 'isDefault'>) =>
    api.post('users/me/addresses', { json: data }).json<Address>(),
  updateAddress: (id: string, data: Partial<Omit<Address, 'id' | 'userId'>>) =>
    api.patch(`users/me/addresses/${id}`, { json: data }).json<Address>(),
  deleteAddress: (id: string) => api.delete(`users/me/addresses/${id}`).json(),
  setDefaultAddress: (id: string) =>
    api.post(`users/me/addresses/${id}/default`).json<Address>(),
};

// ── Orders ───────────────────────────────────────────────────────────────────
export interface CatalogItemInput {
  productId: string;
  variantName: string;
  quantity: number;
}
export interface CustomPizzaInput {
  sizeId: string;
  doughId: string;
  sauceId: string;
  ingredientIds: string[];
  quantity: number;
}
export interface CreateOrderPayload {
  items?: CatalogItemInput[];
  pizzas?: CustomPizzaInput[];
  paymentMethod: 'CASH' | 'CARD_ON_DELIVERY';
  deliveryType?: 'DELIVERY' | 'PICKUP';
  name?: string;
  phone?: string;
  email?: string;
  street?: string;
  building?: string;
  apt?: string;
  floor?: string;
  entrance?: string;
  addressComment?: string;
  comment?: string;
}

export const ordersApi = {
  create: (data: CreateOrderPayload) => api.post('orders', { json: data }).json<Order>(),
  mine: () => api.get('orders/mine').json<Order[]>(),
  byId: (id: string) => api.get(`orders/${id}`).json<Order>(),
  status: (id: string) => api.get(`orders/${id}/status`).json<OrderStatusInfo>(),
};

// ── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  orders: (status?: OrderStatus) =>
    api.get('admin/orders', { searchParams: status ? { status } : {} }).json<Order[]>(),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    api.patch(`admin/orders/${id}/status`, { json: { status } }).json<Order>(),
  products: () =>
    api
      .get('admin/products')
      .json<(Product & { category: { name: string; slug: string } })[]>(),
  createProduct: (data: Record<string, unknown>) =>
    api.post('admin/products', { json: data }).json(),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    api.patch(`admin/products/${id}`, { json: data }).json(),
  toggleProduct: (id: string, isAvailable: boolean) =>
    api.patch(`admin/products/${id}/availability`, { json: { isAvailable } }).json(),
  deleteProduct: (id: string) => api.delete(`admin/products/${id}`).json(),
};
