import { Elysia } from "elysia";
import { db } from "../db";
import { menuItems } from "../db/schema";
import { eq } from "drizzle-orm";

export const menuItemRoutes = new Elysia().get("/api/menu-items", async ({ query }) => {
  if (!db) return [];

  const restaurantId = query.restaurantId ? Number(query.restaurantId) : undefined;

  if (restaurantId) {
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, restaurantId))
      .orderBy(menuItems.category, menuItems.name);
  }

  return db.select().from(menuItems).orderBy(menuItems.name);
});
