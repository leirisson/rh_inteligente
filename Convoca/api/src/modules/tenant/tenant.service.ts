import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { createTenantWithAdmin } from "../auth/auth.service.js";
import type { JWTPayload } from "../../lib/rbac.js";
import type { OnboardTenantResponse } from "./tenant.schema.js";

export async function onboardTenant(
  app: FastifyInstance,
  tenantName: string,
  adminEmail: string,
  adminName: string,
  adminPassword: string,
): Promise<OnboardTenantResponse> {
  let tenant;
  try {
    tenant = await createTenantWithAdmin(tenantName, adminEmail, adminName, adminPassword);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw Object.assign(new Error("Email already in use"), { statusCode: 409, code: "EMAIL_TAKEN" });
    }
    throw error;
  }
  const admin = tenant.users[0];

  const payload: JWTPayload = {
    type: "company",
    user_id: admin.id,
    tenant_id: tenant.id,
    role: admin.role,
  };

  const accessToken = app.jwt.sign(payload, { expiresIn: "15m" });
  const refreshToken = app.jwt.sign(payload, { expiresIn: "7d" });

  return {
    accessToken,
    refreshToken,
    tenant: {
      id: tenant.id,
      name: tenant.name,
    },
    user: {
      id: admin.id,
      role: admin.role,
      tenantId: tenant.id,
      name: admin.name,
    },
  };
}
