import "server-only";
import { companyFetch } from "@/app/_lib/api/authed-fetch";
import type { UserProfile } from "@/app/_lib/api/types";

export function getMyUserProfile() {
  return companyFetch<UserProfile>("/users/me");
}

export function updateMyUserProfile(input: { name?: string; phone?: string | null }) {
  return companyFetch<UserProfile>("/users/me", { method: "PATCH", body: input });
}
