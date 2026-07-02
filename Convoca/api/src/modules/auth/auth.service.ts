import argon2 from "argon2";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import type { JWTPayload } from "../../lib/rbac.js";
import { UserRole } from "@prisma/client";
import type { LoginResponse } from "./auth.schema.js";

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}

export function buildTokens(app: FastifyInstance, payload: JWTPayload) {
  const accessToken = app.jwt.sign(payload, { expiresIn: "15m" });
  const refreshToken = app.jwt.sign(payload, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

export async function loginUser(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401, code: "INVALID_CREDENTIALS" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401, code: "INVALID_CREDENTIALS" });
  }

  const payload: JWTPayload = {
    type: "company",
    user_id: user.id,
    tenant_id: user.tenantId,
    role: user.role,
  };

  const { accessToken, refreshToken } = buildTokens(app, payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
    },
  };
}

export async function refreshTokens(
  app: FastifyInstance,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: JWTPayload;

  try {
    payload = app.jwt.verify<JWTPayload>(refreshToken);
  } catch {
    throw Object.assign(new Error("Invalid refresh token"), { statusCode: 401, code: "INVALID_TOKEN" });
  }

  const newPayload: JWTPayload =
    payload.type === "candidate"
      ? { type: "candidate", candidate_id: payload.candidate_id }
      : { type: "company", user_id: payload.user_id, tenant_id: payload.tenant_id, role: payload.role };

  return buildTokens(app, newPayload);
}

export async function createTenantWithAdmin(
  tenantName: string,
  adminEmail: string,
  adminName: string,
  adminPassword: string,
) {
  const passwordHash = await hashPassword(adminPassword);

  return prisma.tenant.create({
    data: {
      name: tenantName,
      users: {
        create: {
          email: adminEmail,
          name: adminName,
          passwordHash,
          role: UserRole.TENANT_ADMIN,
        },
      },
    },
    include: { users: true },
  });
}
