import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildTestApp } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
});

describe("POST /tenants", () => {
  it("creates a tenant with an admin user and returns tokens", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/tenants",
      payload: {
        tenantName: "Acme Corp",
        adminEmail: "admin@acme.com",
        adminName: "Admin",
        adminPassword: "AdminPass@123",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{
      accessToken: string;
      refreshToken: string;
      tenant: { id: string; name: string };
      user: { role: string; tenantId: string };
    }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.tenant.name).toBe("Acme Corp");
    expect(body.user.role).toBe("TENANT_ADMIN");
    expect(body.user.tenantId).toBe(body.tenant.id);
  });

  it("returns 409 when the admin email is already in use", async () => {
    const payload = {
      tenantName: "Acme Corp",
      adminEmail: "dup@acme.com",
      adminName: "Admin",
      adminPassword: "AdminPass@123",
    };
    await app.inject({ method: "POST", url: "/tenants", payload });

    const res = await app.inject({
      method: "POST",
      url: "/tenants",
      payload: { ...payload, tenantName: "Other Corp" },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("EMAIL_TAKEN");
  });

  it("returns 400 when body is malformed", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/tenants",
      payload: { tenantName: "", adminEmail: "not-an-email", adminName: "", adminPassword: "short" },
    });

    expect(res.statusCode).toBe(400);
  });
});
