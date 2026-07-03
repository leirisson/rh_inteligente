import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildTestApp, makeAuthHeader, createCompanyUser } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import { createTenantWithAdmin } from "../auth/auth.service.js";
import { UserRole } from "@prisma/client";
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

async function loginNewTenant(suffix: string) {
  await createTenantWithAdmin(
    `Tenant ${suffix}`,
    `admin${suffix}@test.com`,
    `Admin ${suffix}`,
    "AdminPass@123",
  );
  const res = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: `admin${suffix}@test.com`, password: "AdminPass@123" },
  });
  return res.json<{ accessToken: string; user: { tenantId: string; id: string } }>();
}

describe("GET /users/me", () => {
  it("returns the authenticated user's data", async () => {
    const { accessToken, user } = await loginNewTenant("get-a");

    const res = await app.inject({
      method: "GET",
      url: "/users/me",
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ id: string; phone: string | null }>();
    expect(body.id).toBe(user.id);
    expect(body.phone).toBeNull();
  });

  it("returns 401 without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/users/me" });
    expect(res.statusCode).toBe(401);
  });

  it.each([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.RECRUITER, UserRole.DEPARTMENT_LEAD])(
    "works for role %s",
    async (role) => {
      const { user } = await loginNewTenant(`role-${role}`);
      const companyUser = await createCompanyUser(app, user.tenantId, role, `role-${role}`);

      const res = await app.inject({
        method: "GET",
        url: "/users/me",
        headers: makeAuthHeader(companyUser.accessToken),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json<{ role: string }>().role).toBe(role);
    },
  );
});

describe("PATCH /users/me", () => {
  it("updates name and phone", async () => {
    const { accessToken } = await loginNewTenant("patch-a");

    const res = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: makeAuthHeader(accessToken),
      payload: { name: "New Name", phone: "+55 11 98765-4321" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ name: string; phone: string }>();
    expect(body.name).toBe("New Name");
    expect(body.phone).toBe("+55 11 98765-4321");
  });

  it("rejects an invalid Brazilian phone format", async () => {
    const { accessToken } = await loginNewTenant("patch-b");

    const res = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: makeAuthHeader(accessToken),
      payload: { phone: "not-a-phone" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("allows clearing the phone with null", async () => {
    const { accessToken } = await loginNewTenant("patch-c");
    await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: makeAuthHeader(accessToken),
      payload: { phone: "11987654321" },
    });

    const res = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: makeAuthHeader(accessToken),
      payload: { phone: null },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ phone: string | null }>().phone).toBeNull();
  });
});
