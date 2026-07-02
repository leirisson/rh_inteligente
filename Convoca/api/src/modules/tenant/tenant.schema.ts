import { z } from "zod";
import { UserRole } from "@prisma/client";

export const onboardTenantBodySchema = z.object({
  tenantName: z.string().min(1),
  adminEmail: z.string().email(),
  adminName: z.string().min(1),
  adminPassword: z.string().min(8),
});

export const onboardTenantResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tenant: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  user: z.object({
    id: z.string().uuid(),
    role: z.nativeEnum(UserRole),
    tenantId: z.string().uuid(),
    name: z.string(),
  }),
});

export type OnboardTenantBody = z.infer<typeof onboardTenantBodySchema>;
export type OnboardTenantResponse = z.infer<typeof onboardTenantResponseSchema>;
