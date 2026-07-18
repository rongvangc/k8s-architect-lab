import type { Restaurant, MenuItem, Order, CreateOrderInput } from "../types";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export function fetchRestaurants(): Promise<Restaurant[]> {
  return fetchJson<Restaurant[]>("/api/restaurants");
}

export function fetchRestaurant(id: number): Promise<Restaurant & { menu: Record<string, MenuItem[]> }> {
  return fetchJson(`/api/restaurants/${id}`);
}

export function createOrder(data: CreateOrderInput): Promise<Order> {
  return fetchJson("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function fetchOrders(): Promise<Order[]> {
  return fetchJson<Order[]>("/api/orders");
}

export function fetchOrder(id: number): Promise<Order> {
  return fetchJson<Order>(`/api/orders/${id}`);
}

export function updateOrderStatus(id: number, status: string): Promise<Order> {
  return fetchJson<Order>(`/api/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
