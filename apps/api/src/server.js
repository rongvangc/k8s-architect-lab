import express from "express";
import pg from "pg";

const app = express();
const port = Number(process.env.PORT || 3000);
const serviceName = process.env.SERVICE_NAME || "architect-lab-api";
const environment = process.env.APP_ENV || "prod";
const databaseHost = process.env.DATABASE_HOST;
const pool = databaseHost
  ? new pg.Pool({
      host: databaseHost,
      port: Number(process.env.DATABASE_PORT || 5432),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      connectionTimeoutMillis: 3000,
      max: 10
    })
  : null;

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: serviceName,
    environment
  });
});

app.get("/ready", async (req, res, next) => {
  if (!pool) {
    return res.status(503).json({ status: "database_not_configured" });
  }

  try {
    await pool.query("select 1");
    return res.json({ status: "ready" });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/info", (req, res) => {
  res.json({
    service: serviceName,
    environment,
    hostname: process.env.HOSTNAME || "unknown",
    message: "Kubernetes architect lab API is running"
  });
});

app.get("/api/db", async (req, res, next) => {
  if (!pool) {
    return res.status(503).json({
      status: "disabled",
      reason: "DATABASE_HOST is not configured"
    });
  }

  try {
    const result = await pool.query("select now() as database_time");
    return res.json({
      status: "ok",
      databaseTime: result.rows[0].database_time
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(JSON.stringify({
    level: "error",
    path: req.originalUrl,
    message: error.message
  }));

  res.status(500).json({
    error: "internal server error"
  });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({
    level: "info",
    event: "service_started",
    service: serviceName,
    environment,
    port
  }));
});

async function shutdown(signal) {
  console.log(JSON.stringify({ level: "info", event: "shutdown", signal }));
  server.close(async () => {
    if (pool) await pool.end();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 25000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
