import { router } from "expo-router";
import { API_BASE_URL } from "./constants";
import { clearToken, getToken } from "./auth";
import type {
  AdminStats,
  Collection,
  Order,
  OrderItemInput,
  OrderPatch,
  OrderStatus,
  Product,
  ProductInput,
} from "./types";

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

export async function apiFetch<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };

  if (opts.auth ?? true) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers, body });
  } catch {
    throw new ApiError(0, `Serveur injoignable (${API_BASE_URL}). Vérifiez l'adresse dans Réglages.`);
  }

  if (response.status === 401 && (opts.auth ?? true)) {
    await clearToken();
    router.replace("/login");
    throw new ApiError(401, "Session expired");
  }

  const text = await response.text();
  const json: unknown = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })()
    : null;

  if (!response.ok) {
    const message = (json as { error?: string } | null)?.error ?? `HTTP ${response.status}`;
    throw new ApiError(response.status, message, json);
  }

  return json as T;
}

export const api = {
  login: (password: string) =>
    apiFetch<{ ok: true; token: string; expiresIn: number }>("/api/admin/login", {
      method: "POST",
      body: { password },
      auth: false,
    }),

  stats: () => apiFetch<AdminStats>("/api/admin/stats"),

  orders: (status?: OrderStatus) =>
    apiFetch<{ orders: Order[] }>(`/api/admin/orders${status ? `?status=${status}` : ""}`),

  order: (id: string) => apiFetch<{ order: Order }>(`/api/admin/orders/${id}`),

  setOrderStatus: (id: string, status: OrderStatus) =>
    apiFetch<{ order: Order }>(`/api/admin/orders/${id}`, { method: "PATCH", body: { status } }),

  updateOrder: (id: string, patch: OrderPatch) =>
    apiFetch<{ order: Order }>(`/api/admin/orders/${id}`, { method: "PATCH", body: patch }),

  /**
   * Books the parcel with Intigo and returns its NID. The city and délégation
   * come from what the customer picked at checkout — Intigo rejects an unknown
   * name — and the server resolves the pickup index itself.
   */
  shipOrder: (id: string, cityName: string, districtName: string) =>
    apiFetch<{ order: Order; trackingCode: string }>(`/api/admin/orders/${id}/ship`, {
      method: "POST",
      body: { city_name: cityName, district_name: districtName },
    }),

  /** Replaces every line; the server recomputes subtotal, shipping and total. */
  setOrderItems: (id: string, items: OrderItemInput[]) =>
    apiFetch<{ order: Order }>(`/api/admin/orders/${id}/items`, { method: "PUT", body: { items } }),

  products: () => apiFetch<{ products: Product[] }>("/api/admin/products"),

  product: (id: string) => apiFetch<{ product: Product }>(`/api/admin/products/${id}`),

  createProduct: (input: ProductInput) =>
    apiFetch<{ product: Product }>("/api/admin/products", { method: "POST", body: input }),

  updateProduct: (id: string, patch: Partial<ProductInput>) =>
    apiFetch<{ product: Product }>(`/api/admin/products/${id}`, { method: "PATCH", body: patch }),

  deleteProduct: (id: string) =>
    apiFetch<{ ok: true }>(`/api/admin/products/${id}`, { method: "DELETE" }),

  collections: () => apiFetch<{ collections: Collection[] }>("/api/admin/collections"),

  /**
   * Uploads one photo. React Native's fetch accepts a {uri,name,type} object in
   * place of a File, so the picker result can be posted straight through.
   */
  uploadImage: async (asset: { uri: string; name: string; type: string }) => {
    const body = new FormData();
    body.append("file", asset as unknown as Blob);

    const headers: Record<string, string> = { Accept: "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/admin/uploads`, {
      method: "POST",
      headers,
      body,
    });

    const payload = (await response.json().catch(() => null)) as
      | { url?: string; error?: string }
      | null;

    if (!response.ok || !payload?.url) {
      throw new ApiError(response.status, payload?.error ?? `Upload failed (${response.status})`);
    }
    return payload.url;
  },
};
