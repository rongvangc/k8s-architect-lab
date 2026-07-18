import { Elysia } from "elysia";
import { pool, db } from "./db";
import { runMigrations } from "./db/migrate";
import { seedIfEmpty } from "./db/seed";
import { healthRoutes } from "./routes/health";
import { infoRoutes } from "./routes/info";
import { dbRoutes } from "./routes/db";
import { restaurantRoutes } from "./routes/restaurants";
import { menuItemRoutes } from "./routes/menu-items";
import { orderRoutes } from "./routes/orders";

const port = Number(process.env.PORT || 3000);
const serviceName = process.env.SERVICE_NAME || "architect-lab-api";
const environment = process.env.APP_ENV || "prod";

async function main() {
  if (pool && db) {
    await runMigrations(pool);
    await seedIfEmpty(db);
  } else {
    console.log(
      JSON.stringify({
        level: "warn",
        event: "database_not_configured",
        message: "DATABASE_HOST not set, running without database",
      })
    );
  }

  const app = new Elysia()
    .use(healthRoutes)
    .use(infoRoutes)
    .use(dbRoutes)
    .use(restaurantRoutes)
    .use(menuItemRoutes)
    .use(orderRoutes)
    .onError(({ code, error, set }) => {
      console.error(
        JSON.stringify({
          level: "error",
          code,
          message: error.message,
        })
      );
      set.status = 500;
      return { error: "internal server error" };
    })
    .listen({ port, hostname: "0.0.0.0" });

  console.log(
    JSON.stringify({
      level: "info",
      event: "service_started",
      service: serviceName,
      environment,
      port,
    })
  );

  async function shutdown(signal: string) {
    console.log(JSON.stringify({ level: "info", event: "shutdown", signal }));
    app.stop();
    if (pool) await pool.end();
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
