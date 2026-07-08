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

describe("GET /tenants/:id/users", () => {
  it("lists only the members of the given tenant", async () => {
    const { accessToken, user } = await loginNewTenant("list-a");
    await createCompanyUser(app, user.tenantId, UserRole.RECRUITER, "list-a");
    const other = await loginNewTenant("list-b");
    await createCompanyUser(app, other.user.tenantId, UserRole.RECRUITER, "list-b");

    const res = await app.inject({
      method: "GET",
      url: `/tenants/${user.tenantId}/users`,
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ email: string }[]>();
    expect(body).toHaveLength(2);
    expect(body.every((m) => m.email.endsWith("list-a@test.com"))).toBe(true);
  });

  it("returns 404 when the tenant id does not match the caller's tenant", async () => {
    const { accessToken } = await loginNewTenant("list-c");
    const other = await loginNewTenant("list-d");

    const res = await app.inject({
      method: "GET",
      url: `/tenants/${other.user.tenantId}/users`,
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 403 for non-TENANT_ADMIN roles", async () => {
    const { user } = await loginNewTenant("list-e");
    const recruiter = await createCompanyUser(app, user.tenantId, UserRole.RECRUITER, "list-e");

    const res = await app.inject({
      method: "GET",
      url: `/tenants/${user.tenantId}/users`,
      headers: makeAuthHeader(recruiter.accessToken),
    });

    expect(res.statusCode).toBe(403);
  });
});

describe("POST /tenants/:id/users", () => {
  it("creates a new team member", async () => {
    const { accessToken, user } = await loginNewTenant("create-a");

    const res = await app.inject({
      method: "POST",
      url: `/tenants/${user.tenantId}/users`,
      headers: makeAuthHeader(accessToken),
      payload: {
        name: "New Member",
        email: "newmember-create-a@test.com",
        password: "MemberPass@123",
        role: UserRole.RECRUITER,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{ email: string; role: string }>();
    expect(body.email).toBe("newmember-create-a@test.com");
    expect(body.role).toBe(UserRole.RECRUITER);

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "newmember-create-a@test.com", password: "MemberPass@123" },
    });
    expect(loginRes.statusCode).toBe(200);
  });

  it("returns 409 when the email is already in use", async () => {
    const { accessToken, user } = await loginNewTenant("create-b");

    const res = await app.inject({
      method: "POST",
      url: `/tenants/${user.tenantId}/users`,
      headers: makeAuthHeader(accessToken),
      payload: {
        name: "Duplicate",
        email: "admincreate-b@test.com",
        password: "MemberPass@123",
        role: UserRole.RECRUITER,
      },
    });

    expect(res.statusCode).toBe(409);
  });

  it("returns 400 for an invalid role", async () => {
    const { accessToken, user } = await loginNewTenant("create-c");

    const res = await app.inject({
      method: "POST",
      url: `/tenants/${user.tenantId}/users`,
      headers: makeAuthHeader(accessToken),
      payload: {
        name: "Bad Role",
        email: "badrole-create-c@test.com",
        password: "MemberPass@123",
        role: "NOT_A_ROLE",
      },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("PATCH /tenants/:id/users/:userId/role", () => {
  it("updates the role of an existing member", async () => {
    const { accessToken, user } = await loginNewTenant("role-a");
    const member = await createCompanyUser(app, user.tenantId, UserRole.RECRUITER, "role-a");

    const res = await app.inject({
      method: "PATCH",
      url: `/tenants/${user.tenantId}/users/${member.user.id}/role`,
      headers: makeAuthHeader(accessToken),
      payload: { role: UserRole.DEPARTMENT_LEAD },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ role: string }>().role).toBe(UserRole.DEPARTMENT_LEAD);
  });

  it("returns 404 when the member belongs to another tenant", async () => {
    const { accessToken, user } = await loginNewTenant("role-b");
    const other = await loginNewTenant("role-c");
    const foreignMember = await createCompanyUser(app, other.user.tenantId, UserRole.RECRUITER, "role-c");

    const res = await app.inject({
      method: "PATCH",
      url: `/tenants/${user.tenantId}/users/${foreignMember.user.id}/role`,
      headers: makeAuthHeader(accessToken),
      payload: { role: UserRole.TENANT_ADMIN },
    });

    expect(res.statusCode).toBe(404);
  });
});
