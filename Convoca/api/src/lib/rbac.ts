import type { FastifyReply, FastifyRequest } from "fastify";
import { UserRole } from "@prisma/client";

export type { UserRole };

export interface JWTPayload {
  user_id: string;
  tenant_id: string | null;
  role: UserRole;
}

export function requireRoles(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || !roles.includes(request.user.role)) {
      await reply.status(403).send({ error: { message: "Forbidden", code: "FORBIDDEN" } });
    }
  };
}
