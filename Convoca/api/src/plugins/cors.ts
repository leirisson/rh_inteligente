import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";
import { config } from "../config/index";

export async function corsPlugin(app: FastifyInstance) {
  await app.register(cors, {
    origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
}
