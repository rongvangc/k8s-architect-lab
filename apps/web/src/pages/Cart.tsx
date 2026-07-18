import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useCart } from "../context/CartContext";
import { createOrder } from "../api/client";

export function Cart() {
  const { cart, restaurantId, restaurantName, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customerName: "", phone: "", deliveryAddress: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !cart.length) return;

    setSubmitting(true);
    try {
      const order = await createOrder({
        restaurantId,
        customerName: form.customerName,
        phone: form.phone,
        deliveryAddress: form.deliveryAddress,
        items: cart.map((item) => ({ menuItemId: item.menuItem.id, quantity: item.quantity })),
      });
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
        <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium">
          Browse restaurants →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart</h1>
      <p className="text-gray-500 mb-6">From {restaurantName}</p>

      <div className="space-y-3 mb-8">
        {cart.map((item) => (
          <div key={item.menuItem.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-100 p-4">
            <div>
              <h3 className="font-medium text-gray-900">{item.menuItem.name}</h3>
              <p className="text-orange-500 text-sm font-medium">{Number(item.menuItem.price).toLocaleString()}đ</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                +
              </button>
              <button
                onClick={() => removeFromCart(item.menuItem.id)}
                className="text-red-400 hover:text-red-600 text-sm ml-2 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 mb-8">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span className="text-orange-500">{cartTotal.toLocaleString()}đ</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Delivery Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            required
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
          <textarea
            required
            value={form.deliveryAddress}
            onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={3}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Placing order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}
