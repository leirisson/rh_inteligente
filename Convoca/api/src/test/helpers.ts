import { buildApp } from "../app.js";
import type { FastifyInstance } from "fastify";

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

export function makeAuthHeader(token: string) {
  return { authorization: `Bearer ${token}` };
}
