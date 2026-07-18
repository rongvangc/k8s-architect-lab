import type { Restaurant } from "../types";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow bg-white">
      {restaurant.imageUrl && (
        <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-lg">{restaurant.name}</h3>
          <span className="text-yellow-500 text-sm font-medium">★ {restaurant.rating}</span>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2 mb-2">{restaurant.description}</p>
        <p className="text-gray-400 text-xs">{restaurant.address}</p>
      </div>
    </div>
  );
}
