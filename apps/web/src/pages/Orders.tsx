import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchOrders } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import type { Order } from "../types";

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
      <p className="text-gray-500 mb-6">View and manage your orders</p>

      {!orders.length ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No orders yet</p>
          <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium">
            Browse restaurants →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-900">Order #{order.id}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-600">{order.restaurantName}</span>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  {order.customerName} • {new Date(order.createdAt).toLocaleString()}
                </div>
                <div className="text-orange-500 font-semibold">{Number(order.totalAmount).toLocaleString()}đ</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
