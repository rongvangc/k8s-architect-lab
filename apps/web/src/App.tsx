import { Routes, Route, Link, useLocation } from "react-router";
import { useCart } from "./context/CartContext";
import { Home } from "./pages/Home";
import { RestaurantDetail } from "./pages/RestaurantDetail";
import { Cart } from "./pages/Cart";
import { Orders } from "./pages/Orders";
import { OrderDetail } from "./pages/OrderDetail";

function Layout() {
  const { cartCount } = useCart();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-orange-500">
            Food Delivery
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/orders"
              className={`text-sm font-medium ${location.pathname.startsWith("/orders") ? "text-orange-500" : "text-gray-600 hover:text-gray-900"}`}
            >
              Orders
            </Link>
            <Link
              to="/cart"
              className={`text-sm font-medium flex items-center gap-1 ${location.pathname === "/cart" ? "text-orange-500" : "text-gray-600 hover:text-gray-900"}`}
            >
              Cart
              {cartCount > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default Layout;
