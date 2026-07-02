import type { Candidate } from "@prisma/client";

export interface CandidateAuthResponse {
  accessToken: string;
  refreshToken: string;
  candidate: Candidate;
}
