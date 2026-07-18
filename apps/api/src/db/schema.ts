import { integer, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const restaurants = pgTable("restaurants", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  imageUrl: varchar("image_url", { length: 500 }),
  address: varchar({ length: 500 }).notNull(),
  rating: numeric({ precision: 2, scale: 1 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  category: varchar({ length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  phone: varchar({ length: 20 }).notNull(),
  status: varchar({ length: 20 }).notNull().default("pending"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  quantity: integer().notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
