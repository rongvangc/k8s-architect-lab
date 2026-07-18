import { Elysia } from "elysia";
import { pool } from "../db";

const serviceName = process.env.SERVICE_NAME || "architect-lab-api";
const environment = process.env.APP_ENV || "prod";

export const healthRoutes = new Elysia()
  .get("/health", () => ({
    status: "ok",
    service: serviceName,
    environment,
  }))
  .get("/ready", async ({ set }) => {
    if (!pool) {
      set.status = 503;
      return { status: "database_not_configured" };
    }
    try {
      await pool.query("select 1");
      return { status: "ready" };
    } catch {
      set.status = 503;
      return { status: "database_unavailable" };
    }
  });
