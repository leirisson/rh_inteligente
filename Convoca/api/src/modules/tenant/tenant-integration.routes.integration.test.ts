import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildTestApp, makeAuthHeader, createCompanyUser } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import { createTenantWithAdmin } from "../auth/auth.service.js";
import { UserRole } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await prisma.tenantIntegration.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  await prisma.tenantIntegration.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  fetchMock = vi.fn(async (url: string) => {
    if (url.includes("/instance/create")) {
      return {
        ok: true,
        json: async () => ({ hash: "instance-token", qrcode: { base64: "data:image/png;base64,AAA" } }),
      };
    }
    if (url.includes("/instance/connect/")) {
      return { ok: true, json: async () => ({ base64: "data:image/png;base64,BBB" }) };
    }
    if (url.includes("/webhook/set/")) {
      return { ok: true, json: async () => ({}) };
    }
    if (url.includes("/instance/logout/")) {
      return { ok: true, json: async () => ({}) };
    }
    return { ok: true, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock);
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

describe("POST /tenants/:id/integrations/whatsapp/connect", () => {
  it("creates a TenantIntegration and returns a QR code, status CONNECTING", async () => {
    const { accessToken, user } = await loginNewTenant("connect-a");

    const res = await app.inject({
      method: "POST",
      url: `/tenants/${user.tenantId}/integrations/whatsapp/connect`,
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string; qrCode: string | null }>();
    expect(body.status).toBe("CONNECTING");
    expect(body.qrCode).toBe("data:image/png;base64,AAA");

    const integration = await prisma.tenantIntegration.findUnique({ where: { tenantId: user.tenantId } });
    expect(integration?.status).toBe("CONNECTING");
    expect(integration?.evolutionApiKey).toBe("instance-token");
  });

  it("returns 401 without a token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/tenants/00000000-0000-0000-0000-000000000000/integrations/whatsapp/connect",
    });
    expect(res.statusCode).toBe(401);
  });

  it("reconnects an existing (disconnected) integration via /instance/connect instead of /instance/create", async () => {
    const { accessToken, user } = await loginNewTenant("connect-reconnect");
    await prisma.tenantIntegration.create({
      data: {
        tenantId: user.tenantId,
        evolutionInstanceName: `convoca_${user.tenantId}`,
        status: "DISCONNECTED",
        lastErrorMessage: "previous failure",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/tenants/${user.tenantId}/integrations/whatsapp/connect`,
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string; qrCode: string | null }>();
    expect(body.status).toBe("CONNECTING");
    expect(body.qrCode).toBe("data:image/png;base64,BBB");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/instance/connect/convoca_${user.tenantId}`),
      expect.objectContaining({ method: "GET" }),
    );

    const integration = await prisma.tenantIntegration.findUniqueOrThrow({
      where: { tenantId: user.tenantId },
    });
    expect(integration.status).toBe("CONNECTING");
    expect(integration.lastErrorMessage).toBeNull();
  });

  it("propagates a 502 when the Evolution API create call fails", async () => {
    const { accessToken, user } = await loginNewTenant("connect-fail");
    fetchMock.mockImplementationOnce(async () => ({ ok: false, status: 500, json: async () => ({}) }));

    const res = await app.inject({
      method: "POST",
      url: `/tenants/${user.tenantId}/integrations/whatsapp/connect`,
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(502);
  });
});

describe("GET /tenants/:id/integrations/whatsapp/status", () => {
  it("returns DISCONNECTED when no integration exists", async () => {
    const { accessToken, user } = await loginNewTenant("status-a");

    const res = await app.inject({
      method: "GET",
      url: `/tenants/${user.tenantId}/integrations/whatsapp/status`,
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "DISCONNECTED", connectedPhoneNumber: null });
  });

  it("returns the masked phone number once connected", async () => {
    const { accessToken, user } = await loginNewTenant("status-b");
    await prisma.tenantIntegration.create({
      data: {
        tenantId: user.tenantId,
        evolutionInstanceName: `convoca_${user.tenantId}`,
        status: "CONNECTED",
        connectedPhoneNumber: "5511987654321",
      },
    });

    const res = await app.inject({
      method: "GET",
      url: `/tenants/${user.tenantId}/integrations/whatsapp/status`,
      headers: makeAuthHeader(accessToken),
    });

    const body = res.json<{ status: string; connectedPhoneNumber: string }>();
    expect(body.status).toBe("CONNECTED");
    expect(body.connectedPhoneNumber).toMatch(/^\+55 11 9\*\*\*\*-4321$/);
  });
});

describe("POST /tenants/:id/integrations/whatsapp/disconnect", () => {
  it("disconnects an existing integration", async () => {
    const { accessToken, user } = await loginNewTenant("disconnect-a");
    await prisma.tenantIntegration.create({
      data: {
        tenantId: user.tenantId,
        evolutionInstanceName: `convoca_${user.tenantId}`,
        status: "CONNECTED",
        connectedPhoneNumber: "5511987654321",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/tenants/${user.tenantId}/integrations/whatsapp/disconnect`,
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "DISCONNECTED" });

    const integration = await prisma.tenantIntegration.findUnique({ where: { tenantId: user.tenantId } });
    expect(integration?.status).toBe("DISCONNECTED");
    expect(integration?.connectedPhoneNumber).toBeNull();
  });

  it("returns 404 when no integration exists yet", async () => {
    const { accessToken, user } = await loginNewTenant("disconnect-b");

    const res = await app.inject({
      method: "POST",
      url: `/tenants/${user.tenantId}/integrations/whatsapp/disconnect`,
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(404);
  });
});

describe("tenant isolation", () => {
  it("tenant A cannot read/connect/disconnect tenant B's integration", async () => {
    const tenantA = await loginNewTenant("iso-a");
    const tenantB = await loginNewTenant("iso-b");

    await prisma.tenantIntegration.create({
      data: {
        tenantId: tenantB.user.tenantId,
        evolutionInstanceName: `convoca_${tenantB.user.tenantId}`,
        status: "CONNECTED",
        connectedPhoneNumber: "5511987654321",
      },
    });

    const connectRes = await app.inject({
      method: "POST",
      url: `/tenants/${tenantB.user.tenantId}/integrations/whatsapp/connect`,
      headers: makeAuthHeader(tenantA.accessToken),
    });
    expect(connectRes.statusCode).toBe(404);

    const statusRes = await app.inject({
      method: "GET",
      url: `/tenants/${tenantB.user.tenantId}/integrations/whatsapp/status`,
      headers: makeAuthHeader(tenantA.accessToken),
    });
    expect(statusRes.statusCode).toBe(404);

    const disconnectRes = await app.inject({
      method: "POST",
      url: `/tenants/${tenantB.user.tenantId}/integrations/whatsapp/disconnect`,
      headers: makeAuthHeader(tenantA.accessToken),
    });
    expect(disconnectRes.statusCode).toBe(404);

    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenantB.user.tenantId },
    });
    expect(integration?.status).toBe("CONNECTED");
  });
});

describe("role enforcement", () => {
  it("non-TENANT_ADMIN roles cannot connect/disconnect but can read status", async () => {
    const { user } = await loginNewTenant("role-a");
    const recruiter = await createCompanyUser(app, user.tenantId, UserRole.RECRUITER, "role-a");

    const connectRes = await app.inject({
      method: "POST",
      url: `/tenants/${user.tenantId}/integrations/whatsapp/connect`,
      headers: makeAuthHeader(recruiter.accessToken),
    });
    expect(connectRes.statusCode).toBe(403);

    const statusRes = await app.inject({
      method: "GET",
      url: `/tenants/${user.tenantId}/integrations/whatsapp/status`,
      headers: makeAuthHeader(recruiter.accessToken),
    });
    expect(statusRes.statusCode).toBe(200);
  });
});
