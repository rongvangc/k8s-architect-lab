import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchRestaurants } from "../api/client";
import { RestaurantCard } from "../components/RestaurantCard";
import type { Restaurant } from "../types";

export function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants()
      .then(setRestaurants)
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Food Delivery</h1>
        <p className="text-gray-500 mt-2">Order from your favorite restaurants</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((r) => (
          <Link key={r.id} to={`/restaurants/${r.id}`}>
            <RestaurantCard restaurant={r} />
          </Link>
        ))}
      </div>
    </div>
  );
}
