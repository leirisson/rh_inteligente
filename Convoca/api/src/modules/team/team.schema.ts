import { z } from "zod";
import { UserRole } from "@prisma/client";

export const teamTenantParamsSchema = z.object({
  id: z.string().uuid(),
});

export const teamMemberParamsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export const teamMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  phone: z.string().nullable(),
  createdAt: z.date(),
});

export const listTeamResponseSchema = z.array(teamMemberSchema);

export const createTeamMemberBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
});

export const updateTeamMemberRoleBodySchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type TeamMemberParams = z.infer<typeof teamMemberParamsSchema>;
export type CreateTeamMemberBody = z.infer<typeof createTeamMemberBodySchema>;
export type UpdateTeamMemberRoleBody = z.infer<typeof updateTeamMemberRoleBodySchema>;
