import type { FastifyReply, FastifyRequest } from "fastify";
import { UserRole } from "@prisma/client";

export type { UserRole };

export interface CompanyJWTPayload {
  type: "company";
  user_id: string;
  tenant_id: string | null;
  role: UserRole;
}

export interface CandidateJWTPayload {
  type: "candidate";
  candidate_id: string;
}

export type JWTPayload = CompanyJWTPayload | CandidateJWTPayload;

export function requireRoles(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || request.user.type !== "company" || !roles.includes(request.user.role)) {
      await reply.status(403).send({ error: { message: "Forbidden", code: "FORBIDDEN" } });
    }
  };
}

export async function requireCandidate(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.type !== "candidate") {
    await reply.status(403).send({ error: { message: "Forbidden", code: "FORBIDDEN" } });
  }
}
