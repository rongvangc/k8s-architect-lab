import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { fetchRestaurant } from "../api/client";
import { useCart } from "../context/CartContext";
import type { Restaurant, MenuItem } from "../types";

export function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<(Restaurant & { menu: Record<string, MenuItem[]> }) | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, cartCount } = useCart();

  useEffect(() => {
    fetchRestaurant(Number(id))
      .then(setRestaurant)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!restaurant) {
    return <p className="text-center text-gray-500 py-12">Restaurant not found</p>;
  }

  return (
    <div>
      <Link to="/" className="text-orange-500 hover:text-orange-600 text-sm mb-4 inline-block">
        ← Back to restaurants
      </Link>

      {restaurant.imageUrl && (
        <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-64 object-cover rounded-xl mb-6" />
      )}

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
        <span className="text-yellow-500 text-lg font-medium">★ {restaurant.rating}</span>
      </div>
      <p className="text-gray-500 mb-1">{restaurant.description}</p>
      <p className="text-gray-400 text-sm mb-8">{restaurant.address}</p>

      {Object.entries(restaurant.menu).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">{category}</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  {item.description && <p className="text-gray-500 text-sm mt-1">{item.description}</p>}
                  <p className="text-orange-500 font-semibold mt-1">{Number(item.price).toLocaleString()}đ</p>
                </div>
                <button
                  onClick={() => addToCart(item, restaurant.name)}
                  className="ml-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium cursor-pointer"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6">
          <Link
            to="/cart"
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors font-medium"
          >
            🛒 {cartCount} item{cartCount > 1 ? "s" : ""}
          </Link>
        </div>
      )}
    </div>
  );
}
