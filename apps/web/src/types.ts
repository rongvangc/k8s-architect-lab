export interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  address: string;
  rating: string;
  createdAt: string;
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  category: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string | null;
  quantity: number;
  unitPrice: string;
}

export interface Order {
  id: number;
  restaurantId: number;
  restaurantName: string | null;
  customerName: string;
  deliveryAddress: string;
  phone: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface CreateOrderInput {
  restaurantId: number;
  customerName: string;
  deliveryAddress: string;
  phone: string;
  items: { menuItemId: number; quantity: number }[];
}
