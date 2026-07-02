import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRole } from "@prisma/client";

// Mock Prisma before importing the service so the singleton uses the mock
vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    tenant: {
      create: vi.fn(),
    },
  },
}));

// Mock argon2 to keep tests fast (no real hashing)
vi.mock("argon2", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$argon2id$hashed"),
    verify: vi.fn(),
  },
  hash: vi.fn().mockResolvedValue("$argon2id$hashed"),
  verify: vi.fn(),
}));

import { prisma } from "../../lib/prisma.js";
import argon2 from "argon2";
import { loginUser, refreshTokens, createTenantWithAdmin, hashPassword, verifyPassword } from "./auth.service.js";

const mockPrismaUser = {
  id: "user-uuid",
  tenantId: "tenant-uuid",
  email: "admin@demo.com",
  passwordHash: "$argon2id$hashed",
  role: UserRole.TENANT_ADMIN,
  name: "Admin Demo",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeApp(signResult = "signed-token") {
  return {
    jwt: {
      sign: vi.fn().mockReturnValue(signResult),
      verify: vi.fn(),
    },
  } as unknown as import("fastify").FastifyInstance;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hashPassword / verifyPassword", () => {
  it("delegates to argon2.hash", async () => {
    const result = await hashPassword("plain");
    expect(argon2.hash).toHaveBeenCalledWith("plain");
    expect(result).toBe("$argon2id$hashed");
  });

  it("delegates to argon2.verify", async () => {
    vi.mocked(argon2.verify).mockResolvedValue(true);
    const result = await verifyPassword("plain", "$argon2id$hashed");
    expect(argon2.verify).toHaveBeenCalledWith("$argon2id$hashed", "plain");
    expect(result).toBe(true);
  });
});

describe("loginUser", () => {
  it("returns tokens and user data on valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockPrismaUser);
    vi.mocked(argon2.verify).mockResolvedValue(true);

    const app = makeApp("access-token");
    const result = await loginUser(app, "admin@demo.com", "correct-password");

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("access-token");
    expect(result.user.id).toBe("user-uuid");
    expect(result.user.role).toBe(UserRole.TENANT_ADMIN);
    expect(result.user.tenantId).toBe("tenant-uuid");
  });

  it("throws 401 when user is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const app = makeApp();
    await expect(loginUser(app, "nobody@demo.com", "any")).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("throws 401 when password is wrong", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockPrismaUser);
    vi.mocked(argon2.verify).mockResolvedValue(false);

    const app = makeApp();
    await expect(loginUser(app, "admin@demo.com", "wrong")).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("never leaks the password hash in the returned payload", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockPrismaUser);
    vi.mocked(argon2.verify).mockResolvedValue(true);

    const app = makeApp();
    const result = await loginUser(app, "admin@demo.com", "correct");

    expect(JSON.stringify(result)).not.toContain("$argon2id$");
    expect(JSON.stringify(result)).not.toContain("passwordHash");
  });
});

describe("refreshTokens", () => {
  it("issues new tokens when the refresh token is valid", async () => {
    const payload = { type: "company" as const, user_id: "u1", tenant_id: "t1", role: UserRole.RECRUITER };
    const app = makeApp("new-access-token");
    vi.mocked(app.jwt.verify).mockReturnValue(payload);

    const result = await refreshTokens(app, "valid-refresh-token");

    expect(app.jwt.verify).toHaveBeenCalledWith("valid-refresh-token");
    expect(result.accessToken).toBe("new-access-token");
  });

  it("issues new tokens for a candidate refresh token", async () => {
    const payload = { type: "candidate" as const, candidate_id: "cand-1" };
    const app = makeApp("new-candidate-token");
    vi.mocked(app.jwt.verify).mockReturnValue(payload);

    const result = await refreshTokens(app, "valid-candidate-refresh-token");

    expect(result.accessToken).toBe("new-candidate-token");
  });

  it("throws 401 when the refresh token is invalid", async () => {
    const app = makeApp();
    vi.mocked(app.jwt.verify).mockImplementation(() => {
      throw new Error("jwt expired");
    });

    await expect(refreshTokens(app, "bad-token")).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_TOKEN",
    });
  });
});

describe("createTenantWithAdmin", () => {
  it("creates a tenant with an embedded TENANT_ADMIN user", async () => {
    const tenantResult = {
      id: "new-tenant-uuid",
      name: "Acme Corp",
      createdAt: new Date(),
      updatedAt: new Date(),
      users: [{ ...mockPrismaUser, tenantId: "new-tenant-uuid" }],
    };
    vi.mocked(prisma.tenant.create).mockResolvedValue(tenantResult);

    const result = await createTenantWithAdmin("Acme Corp", "admin@acme.com", "Admin", "Admin@1234");

    expect(prisma.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Acme Corp",
          users: expect.objectContaining({
            create: expect.objectContaining({
              role: UserRole.TENANT_ADMIN,
              email: "admin@acme.com",
            }),
          }),
        }),
      }),
    );
    expect(result.name).toBe("Acme Corp");
    expect(result.users[0].role).toBe(UserRole.TENANT_ADMIN);
  });
});
