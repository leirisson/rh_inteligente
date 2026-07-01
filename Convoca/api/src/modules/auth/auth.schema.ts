import { z } from "zod";
import { UserRole } from "@prisma/client";

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    role: z.nativeEnum(UserRole),
    tenantId: z.string().uuid().nullable(),
    name: z.string(),
  }),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
