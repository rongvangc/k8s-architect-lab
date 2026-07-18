import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { restaurants } from "./schema";

const databaseHost = process.env.DATABASE_HOST;
const databaseUser = process.env.POSTGRES_USER ?? process.env.DATABASE_USER;
const databasePassword = process.env.POSTGRES_PASSWORD ?? process.env.DATABASE_PASSWORD;

const pool = databaseHost
  ? new pg.Pool({
      host: databaseHost,
      port: Number(process.env.DATABASE_PORT || 5432),
      database: process.env.DATABASE_NAME,
      user: databaseUser,
      password: databasePassword,
      connectionTimeoutMillis: 3000,
      max: 10,
    })
  : null;

const db = pool ? drizzle({ client: pool }) : null;

export { db, pool };
