import "server-only";
import { companyFetch } from "@/app/_lib/api/authed-fetch";
import type { TeamMember, CreateTeamMemberBody, UserRole } from "@/app/_lib/api/types";

export function listTeamMembers(tenantId: string) {
  return companyFetch<TeamMember[]>(`/tenants/${tenantId}/users`);
}

export function createTeamMember(tenantId: string, body: CreateTeamMemberBody) {
  return companyFetch<TeamMember>(`/tenants/${tenantId}/users`, { method: "POST", body });
}

export function updateTeamMemberRole(tenantId: string, userId: string, role: UserRole) {
  return companyFetch<TeamMember>(`/tenants/${tenantId}/users/${userId}/role`, {
    method: "PATCH",
    body: { role },
  });
}
