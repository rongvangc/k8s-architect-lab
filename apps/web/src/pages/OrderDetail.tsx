import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { fetchOrder, updateOrderStatus } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import type { Order } from "../types";

const STEP_MAP: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  delivering: 3,
  delivered: 4,
  cancelled: -1,
};

const NEXT_STATUS: Record<string, string> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "delivering",
  delivering: "delivered",
};

const STEPS = ["Pending", "Confirmed", "Preparing", "Delivering", "Delivered"];

export function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = () => {
    fetchOrder(Number(id))
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!order || !confirm("Cancel this order?")) return;
    try {
      const updated = await updateOrderStatus(order.id, "cancelled");
      setOrder(updated);
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order");
    }
  };

  const handleAdvance = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      const updated = await updateOrderStatus(order.id, next);
      setOrder(updated);
    } catch (err) {
      console.error(err);
      alert("Failed to update order status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-gray-500 py-12">Order not found</p>;
  }

  const step = STEP_MAP[order.status] ?? -1;
  const next = NEXT_STATUS[order.status];

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/orders" className="text-orange-500 hover:text-orange-600 text-sm mb-4 inline-block">
        ← Back to orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">Delivery Info</h2>
        <p className="text-gray-600">{order.customerName}</p>
        <p className="text-gray-500 text-sm">{order.phone}</p>
        <p className="text-gray-500 text-sm">{order.deliveryAddress}</p>
        <p className="text-gray-400 text-xs mt-2">
          From <span className="font-medium">{order.restaurantName}</span> • {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {step >= 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i <= step ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs mt-1 ${i <= step ? "text-orange-500 font-medium" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Order Items</h2>
        <div className="space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.menuItemName} × {item.quantity}
              </span>
              <span className="text-gray-600">{(Number(item.unitPrice) * item.quantity).toLocaleString()}đ</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-orange-500">{Number(order.totalAmount).toLocaleString()}đ</span>
        </div>
      </div>

      <div className="flex gap-3">
        {order.status === "pending" && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm cursor-pointer"
          >
            Cancel Order
          </button>
        )}
        {next && (
          <button
            onClick={handleAdvance}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm cursor-pointer"
          >
            {NEXT_STATUS[order.status] === "confirmed"
              ? "Confirm Order"
              : NEXT_STATUS[order.status] === "preparing"
                ? "Start Preparing"
                : NEXT_STATUS[order.status] === "delivering"
                  ? "Start Delivery"
                  : "Mark Delivered"}
          </button>
        )}
      </div>
    </div>
  );
}
