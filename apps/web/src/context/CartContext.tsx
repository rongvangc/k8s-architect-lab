import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { CartItem, MenuItem } from "../types";

interface CartContextType {
  cart: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
  addToCart: (menuItem: MenuItem, restaurantName: string) => void;
  removeFromCart: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  const addToCart = useCallback(
    (menuItem: MenuItem, name: string) => {
      if (restaurantId !== null && restaurantId !== menuItem.restaurantId) {
        if (confirm(`Your cart has items from ${restaurantName}. Clear and add from ${name}?`)) {
          setRestaurantId(menuItem.restaurantId);
          setRestaurantName(name);
          setCart([{ menuItem, quantity: 1 }]);
          return;
        }
        return;
      }

      if (restaurantId === null) {
        setRestaurantId(menuItem.restaurantId);
        setRestaurantName(name);
      }

      setCart((prev) => {
        const existing = prev.find((item) => item.menuItem.id === menuItem.id);
        if (existing) {
          return prev.map((item) =>
            item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, { menuItem, quantity: 1 }];
      });
    },
    [restaurantId, restaurantName]
  );

  const removeFromCart = useCallback((menuItemId: number) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.menuItem.id !== menuItemId);
      if (next.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return next;
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => {
        const next = prev.filter((item) => item.menuItem.id !== menuItemId);
        if (next.length === 0) {
          setRestaurantId(null);
          setRestaurantName(null);
        }
        return next;
      });
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.menuItem.id === menuItemId ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setRestaurantId(null);
    setRestaurantName(null);
  }, []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.menuItem.price) * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return (
    <CartContext.Provider
      value={{ cart, restaurantId, restaurantName, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
