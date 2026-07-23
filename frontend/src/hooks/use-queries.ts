import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  catalogApi, ordersApi, pizzaApi, usersApi, adminApi,
  signIn as apiSignIn, signUp as apiSignUp, type ProductFilters,
  type CreateOrderPayload,
} from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { unwrapError } from '@/lib/api-client';
import { showToast } from '@/components/ui/toast';
import type { OrderStatus } from '@/lib/types';

// ── Catalog ─────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: catalogApi.categories });
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => catalogApi.products(filters),
  });
}

export function useFeatured(limit = 8) {
  return useQuery({ queryKey: ['products', 'featured', limit], queryFn: () => catalogApi.featured(limit) });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogApi.bySlug(slug),
    enabled: !!slug,
  });
}

// ── Pizza builder ────────────────────────────────────────────────────────────

export function usePizzaOptions() {
  return useQuery({ queryKey: ['pizza-options'], queryFn: pizzaApi.options });
}

// ── Orders ───────────────────────────────────────────────────────────────────

export function useMyOrders() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: ordersApi.mine,
    enabled: !!user,
  });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: ['order', id], queryFn: () => ordersApi.byId(id), enabled: !!id });
}

/** Polling-трекинг статуса — обновляется каждые 5 сек. */
export function useOrderStatusPolling(id: string) {
  return useQuery({
    queryKey: ['order-status', id],
    queryFn: () => ordersApi.status(id),
    refetchInterval: 5_000,
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderPayload) => ordersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', 'mine'] });
    },
  });
}

// ── Addresses ───────────────────────────────────────────────────────────────

export function useAddresses() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['addresses'],
    queryFn: usersApi.addresses,
    enabled: !!user,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.deleteAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.setDefaultAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

// ── Auth ────────────────────────────────────────────────────────────────────

export function useSignIn() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: { email: string; password: string }) => apiSignIn(data),
    onSuccess: (res) => setUser(res.user),
    onError: async (err) => showToast(await unwrapError(err), 'error'),
  });
}

export function useSignUp() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: { email: string; password: string; name?: string; phone?: string }) =>
      apiSignUp(data),
    onSuccess: (res) => setUser(res.user),
    onError: async (err) => showToast(await unwrapError(err), 'error'),
  });
}

// ── Admin ───────────────────────────────────────────────────────────────────

export function useAdminOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ['admin', 'orders', status],
    queryFn: () => adminApi.orders(status),
  });
}

export function useAdminProducts() {
  return useQuery({ queryKey: ['admin', 'products'], queryFn: adminApi.products });
}

export function useAdminUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'orders'] }),
  });
}

export function useAdminToggleProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      adminApi.toggleProduct(id, isAvailable),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useAdminDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}