import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildTestApp, makeAuthHeader } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import { createTenantWithAdmin } from "../auth/auth.service.js";
import type { FastifyInstance } from "fastify";

vi.mock("../../lib/embeddings.js", () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0)),
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await prisma.screeningQuestion.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  await prisma.screeningQuestion.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.job.deleteMany();
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
  return res.json<{ accessToken: string; user: { tenantId: string } }>();
}

describe("POST /jobs", () => {
  it("creates a job scoped to the authenticated tenant", async () => {
    const { accessToken } = await loginNewTenant("a");

    const res = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(accessToken),
      payload: { title: "Backend Engineer", description: "Build APIs" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; status: string }>();
    expect(body.status).toBe("DRAFT");
  });

  it("returns 401 without a token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/jobs",
      payload: { title: "Backend Engineer", description: "Build APIs" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("tenant isolation", () => {
  it("a tenant cannot see or edit jobs from another tenant", async () => {
    const tenantA = await loginNewTenant("iso-a");
    const tenantB = await loginNewTenant("iso-b");

    const createRes = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(tenantA.accessToken),
      payload: { title: "Tenant A Job", description: "desc" },
    });
    const job = createRes.json<{ id: string }>();

    const getRes = await app.inject({
      method: "GET",
      url: `/jobs/${job.id}`,
      headers: makeAuthHeader(tenantB.accessToken),
    });
    expect(getRes.statusCode).toBe(404);

    const updateRes = await app.inject({
      method: "PATCH",
      url: `/jobs/${job.id}`,
      headers: makeAuthHeader(tenantB.accessToken),
      payload: { title: "Hijacked" },
    });
    expect(updateRes.statusCode).toBe(404);

    const listRes = await app.inject({
      method: "GET",
      url: "/jobs",
      headers: makeAuthHeader(tenantB.accessToken),
    });
    const list = listRes.json<{ data: unknown[] }>();
    expect(list.data).toHaveLength(0);
  });
});

describe("GET /jobs pagination", () => {
  it("returns paginated results", async () => {
    const tenant = await loginNewTenant("page");

    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: "POST",
        url: "/jobs",
        headers: makeAuthHeader(tenant.accessToken),
        payload: { title: `Job ${i}`, description: "desc" },
      });
    }

    const res = await app.inject({
      method: "GET",
      url: "/jobs?page=1&pageSize=2",
      headers: makeAuthHeader(tenant.accessToken),
    });

    const body = res.json<{ data: unknown[]; page: number; pageSize: number; total: number }>();
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(3);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(2);
  });
});

describe("job activation guard", () => {
  it("cannot activate a job without screening questions", async () => {
    const tenant = await loginNewTenant("guard");

    const createRes = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(tenant.accessToken),
      payload: { title: "No Questions Job", description: "desc" },
    });
    const job = createRes.json<{ id: string }>();

    const activateRes = await app.inject({
      method: "PATCH",
      url: `/jobs/${job.id}/status`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { status: "ACTIVE" },
    });

    expect(activateRes.statusCode).toBe(422);
    const body = activateRes.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("JOB_MISSING_SCREENING_QUESTIONS");
  });

  it("activates a job once it has at least one screening question", async () => {
    const tenant = await loginNewTenant("guard-ok");

    const createRes = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(tenant.accessToken),
      payload: { title: "Has Questions Job", description: "desc" },
    });
    const job = createRes.json<{ id: string }>();

    await app.inject({
      method: "POST",
      url: `/jobs/${job.id}/screening-questions`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { question: "Why do you want this role?", order: 0, weight: 1 },
    });

    const activateRes = await app.inject({
      method: "PATCH",
      url: `/jobs/${job.id}/status`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { status: "ACTIVE" },
    });

    expect(activateRes.statusCode).toBe(200);
    const body = activateRes.json<{ status: string }>();
    expect(body.status).toBe("ACTIVE");
  });
});

describe("job requirements", () => {
  it("creates and lists requirements scoped to a job", async () => {
    const tenant = await loginNewTenant("req");

    const createRes = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(tenant.accessToken),
      payload: { title: "Requirements Job", description: "desc" },
    });
    const job = createRes.json<{ id: string }>();

    await app.inject({
      method: "POST",
      url: `/jobs/${job.id}/requirements`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { text: "5 years of TypeScript" },
    });

    const listRes = await app.inject({
      method: "GET",
      url: `/jobs/${job.id}/requirements`,
      headers: makeAuthHeader(tenant.accessToken),
    });

    const body = listRes.json<{ text: string }[]>();
    expect(body).toHaveLength(1);
    expect(body[0].text).toBe("5 years of TypeScript");
  });
});

describe("DELETE /jobs/:id", () => {
  it("deletes a job owned by the tenant", async () => {
    const tenant = await loginNewTenant("del");

    const createRes = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(tenant.accessToken),
      payload: { title: "To Delete", description: "desc" },
    });
    const job = createRes.json<{ id: string }>();

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/jobs/${job.id}`,
      headers: makeAuthHeader(tenant.accessToken),
    });
    expect(deleteRes.statusCode).toBe(204);

    const getRes = await app.inject({
      method: "GET",
      url: `/jobs/${job.id}`,
      headers: makeAuthHeader(tenant.accessToken),
    });
    expect(getRes.statusCode).toBe(404);
  });
});
