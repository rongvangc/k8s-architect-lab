import { Elysia } from "elysia";
import { db } from "../db";
import { restaurants, menuItems } from "../db/schema";
import { eq } from "drizzle-orm";

export const restaurantRoutes = new Elysia()
  .get("/api/restaurants", async () => {
    if (!db) return [];
    return db.select().from(restaurants).orderBy(restaurants.name);
  })
  .get("/api/restaurants/:id", async ({ params, set }) => {
    if (!db) {
      set.status = 503;
      return { error: "Database not available" };
    }

    const restaurant = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, Number(params.id)))
      .limit(1);

    if (!restaurant.length) {
      set.status = 404;
      return { error: "Restaurant not found" };
    }

    const items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, Number(params.id)))
      .orderBy(menuItems.category, menuItems.name);

    const grouped: Record<string, typeof items> = {};
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    return { ...restaurant[0], menu: grouped };
  });
