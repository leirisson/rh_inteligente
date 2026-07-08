"use server";

import { revalidatePath } from "next/cache";
import { verifyCompanySession } from "@/app/_lib/auth/session";
import { createTeamMember, updateTeamMemberRole } from "@/app/_lib/api/endpoints/team";
import type { CreateTeamMemberBody, TeamMember, UserRole } from "@/app/_lib/api/types";

export async function inviteTeamMemberAction(input: CreateTeamMemberBody): Promise<TeamMember> {
  const session = await verifyCompanySession();
  if (!session.user.tenantId) throw new Error("Sem tenant associado");
  const result = await createTeamMember(session.user.tenantId, input);
  revalidatePath("/empresa/config/equipe");
  return result;
}

export async function updateTeamMemberRoleAction(userId: string, role: UserRole): Promise<TeamMember> {
  const session = await verifyCompanySession();
  if (!session.user.tenantId) throw new Error("Sem tenant associado");
  const result = await updateTeamMemberRole(session.user.tenantId, userId, role);
  revalidatePath("/empresa/config/equipe");
  return result;
}
