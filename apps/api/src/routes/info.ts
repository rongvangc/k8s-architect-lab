import { Elysia } from "elysia";

const serviceName = process.env.SERVICE_NAME || "architect-lab-api";
const environment = process.env.APP_ENV || "prod";

export const infoRoutes = new Elysia().get("/api/info", () => ({
  service: serviceName,
  environment,
  hostname: process.env.HOSTNAME || "unknown",
  message: "Kubernetes architect lab API is running",
}));
