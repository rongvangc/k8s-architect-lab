import { Elysia, t } from "elysia";
import { db, pool } from "../db";
import { orders, orderItems, menuItems, restaurants } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const VALID_STATUSES = ["pending", "confirmed", "preparing", "delivering", "delivered", "cancelled"] as const;
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing"],
  preparing: ["delivering"],
  delivering: ["delivered"],
};

export const orderRoutes = new Elysia()
  .post(
    "/api/orders",
    async ({ body, set }) => {
      if (!db) {
        set.status = 503;
        return { error: "Database not available" };
      }

      const { restaurantId, customerName, deliveryAddress, phone, items } = body;

      if (!items || !items.length) {
        set.status = 400;
        return { error: "Order must have at least one item" };
      }

      const menuItemIds = items.map((i) => i.menuItemId);
      const menuRecords = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, restaurantId));

      const menuMap = new Map(menuRecords.map((m) => [m.id, m]));

      for (const item of items) {
        const menu = menuMap.get(item.menuItemId);
        if (!menu) {
          set.status = 400;
          return { error: `Menu item ${item.menuItemId} not found in restaurant ${restaurantId}` };
        }
      }

      const totalAmount = items.reduce((sum, item) => {
        const menu = menuMap.get(item.menuItemId)!;
        return sum + Number(menu.price) * item.quantity;
      }, 0);

      if (!pool) {
        set.status = 503;
        return { error: "Database pool not available" };
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const orderResult = await client.query(
          `INSERT INTO orders (restaurant_id, customer_name, delivery_address, phone, status, total_amount)
           VALUES ($1, $2, $3, $4, 'pending', $5)
           RETURNING *`,
          [restaurantId, customerName, deliveryAddress, phone, totalAmount.toFixed(2)]
        );

        const order = orderResult.rows[0];

        const insertedItems = [];
        for (const item of items) {
          const menu = menuMap.get(item.menuItemId)!;
          const itemResult = await client.query(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [order.id, item.menuItemId, item.quantity, menu.price]
          );
          insertedItems.push(itemResult.rows[0]);
        }

        await client.query("COMMIT");

        return {
          ...order,
          items: insertedItems,
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    {
      body: t.Object({
        restaurantId: t.Number(),
        customerName: t.String(),
        deliveryAddress: t.String(),
        phone: t.String(),
        items: t.Array(
          t.Object({
            menuItemId: t.Number(),
            quantity: t.Number(),
          })
        ),
      }),
    }
  )
  .get("/api/orders", async () => {
    if (!db) return [];
    return db
      .select({
        id: orders.id,
        restaurantId: orders.restaurantId,
        restaurantName: restaurants.name,
        customerName: orders.customerName,
        deliveryAddress: orders.deliveryAddress,
        phone: orders.phone,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
      .orderBy(desc(orders.createdAt));
  })
  .get("/api/orders/:id", async ({ params, set }) => {
    if (!db) {
      set.status = 503;
      return { error: "Database not available" };
    }

    const orderResult = await db
      .select({
        id: orders.id,
        restaurantId: orders.restaurantId,
        restaurantName: restaurants.name,
        customerName: orders.customerName,
        deliveryAddress: orders.deliveryAddress,
        phone: orders.phone,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
      .where(eq(orders.id, Number(params.id)))
      .limit(1);

    if (!orderResult.length) {
      set.status = 404;
      return { error: "Order not found" };
    }

    const items = await db
      .select({
        id: orderItems.id,
        menuItemId: orderItems.menuItemId,
        menuItemName: menuItems.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, Number(params.id)));

    return { ...orderResult[0], items };
  })
  .patch(
    "/api/orders/:id/status",
    async ({ params, body, set }) => {
      if (!db) {
        set.status = 503;
        return { error: "Database not available" };
      }

      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, Number(params.id)))
        .limit(1);

      if (!orderResult.length) {
        set.status = 404;
        return { error: "Order not found" };
      }

      const order = orderResult[0];
      const newStatus = body.status;

      if (order.status === "delivered" || order.status === "cancelled") {
        set.status = 400;
        return { error: `Cannot change status of a ${order.status} order` };
      }

      const allowed = VALID_TRANSITIONS[order.status];
      if (!allowed || !allowed.includes(newStatus)) {
        set.status = 400;
        return { error: `Cannot transition from ${order.status} to ${newStatus}` };
      }

      const updated = await db
        .update(orders)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, Number(params.id)))
        .returning();

      return updated[0];
    },
    {
      body: t.Object({
        status: t.String(),
      }),
    }
  );
