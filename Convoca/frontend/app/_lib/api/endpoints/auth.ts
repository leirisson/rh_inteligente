import "server-only";
import { apiFetch } from "@/app/_lib/api/client";
import type {
  LoginResponse,
  RefreshResponse,
  OnboardTenantResponse,
  CandidateAuthResponse,
} from "@/app/_lib/api/types";

export function loginCompany(email: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", { method: "POST", body: { email, password } });
}

export function refreshCompanyToken(refreshToken: string) {
  return apiFetch<RefreshResponse>("/auth/refresh", { method: "POST", body: { refreshToken } });
}

export function onboardTenant(input: {
  tenantName: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}) {
  return apiFetch<OnboardTenantResponse>("/tenants", { method: "POST", body: input });
}

export function signupCandidate(input: {
  name: string;
  email: string;
  password: string;
  resumeText?: string;
}) {
  return apiFetch<CandidateAuthResponse>("/candidates/signup", { method: "POST", body: input });
}

export function loginCandidate(email: string, password: string) {
  return apiFetch<CandidateAuthResponse>("/candidates/login", {
    method: "POST",
    body: { email, password },
  });
}
