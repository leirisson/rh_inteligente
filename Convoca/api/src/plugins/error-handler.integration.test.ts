import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildTestApp } from "../test/helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("error-handler plugin", () => {
  it("returns 404 with NOT_FOUND code for unknown routes", async () => {
    const res = await app.inject({ method: "GET", url: "/route-that-does-not-exist" });

    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 with VALIDATION_ERROR when body schema is violated", async () => {
    // POST /auth/login with missing required fields triggers Zod validation
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "not-an-email" }, // missing password, bad email format
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("error envelope always has error.message and error.code fields", async () => {
    const res = await app.inject({ method: "DELETE", url: "/nonexistent" });

    const body = res.json<{ error: { message: string; code: string } }>();
    expect(body.error).toHaveProperty("message");
    expect(body.error).toHaveProperty("code");
    expect(typeof body.error.message).toBe("string");
    expect(typeof body.error.code).toBe("string");
  });
});
