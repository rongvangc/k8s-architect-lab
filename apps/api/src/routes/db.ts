import { Elysia } from "elysia";
import { pool } from "../db";

export const dbRoutes = new Elysia().get("/api/db", async ({ set }) => {
  if (!pool) {
    set.status = 503;
    return { status: "disabled", reason: "DATABASE_HOST is not configured" };
  }
  const result = await pool.query("select now() as database_time");
  return {
    status: "ok",
    databaseTime: result.rows[0].database_time,
  };
});
