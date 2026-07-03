import type { CompanyUser, Candidate } from "@/app/_lib/api/types";

export interface CompanySessionPayload {
  accessToken: string;
  refreshToken: string;
  user: CompanyUser;
}

export interface CandidateSessionPayload {
  accessToken: string;
  refreshToken: string;
  candidate: Candidate;
}
