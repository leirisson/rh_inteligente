import { buildApp } from "../app.js";
import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../modules/auth/auth.service.js";
import type { CompanyJWTPayload } from "../lib/rbac.js";

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

export function makeAuthHeader(token: string) {
  return { authorization: `Bearer ${token}` };
}

export async function createCompanyUser(
  app: FastifyInstance,
  tenantId: string,
  role: UserRole,
  suffix: string,
) {
  const passwordHash = await hashPassword("UserPass@123");
  const user = await prisma.user.create({
    data: {
      tenantId,
      email: `${role.toLowerCase()}${suffix}@test.com`,
      passwordHash,
      role,
      name: `${role} ${suffix}`,
    },
  });

  const payload: CompanyJWTPayload = {
    type: "company",
    user_id: user.id,
    tenant_id: tenantId,
    role,
  };
  const accessToken = app.jwt.sign(payload, { expiresIn: "15m" });

  return { user, accessToken };
}
