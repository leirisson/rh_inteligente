import { describe, it, expect, vi } from "vitest";
import { requireRoles, requireCandidate } from "./rbac.js";
import { UserRole } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { JWTPayload } from "./rbac.js";

function makeRequest(role: UserRole | null): FastifyRequest {
  const user: JWTPayload | undefined = role
    ? { type: "company", user_id: "uuid-1", tenant_id: "tenant-1", role }
    : undefined;
  return { user } as unknown as FastifyRequest;
}

function makeReply() {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply;
}

describe("requireRoles", () => {
  it("passes when the request role is in the allowed list", async () => {
    const guard = requireRoles(UserRole.TENANT_ADMIN, UserRole.RECRUITER);
    const request = makeRequest(UserRole.RECRUITER);
    const reply = makeReply();

    await guard(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("returns 403 when the request role is not in the allowed list", async () => {
    const guard = requireRoles(UserRole.TENANT_ADMIN);
    const request = makeRequest(UserRole.RECRUITER);
    const reply = makeReply();

    await guard(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: { message: "Forbidden", code: "FORBIDDEN" },
    });
  });

  it("returns 403 when request.user is undefined", async () => {
    const guard = requireRoles(UserRole.TENANT_ADMIN);
    const request = makeRequest(null);
    const reply = makeReply();

    await guard(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it("passes for SUPER_ADMIN when listed", async () => {
    const guard = requireRoles(UserRole.SUPER_ADMIN);
    const request = makeRequest(UserRole.SUPER_ADMIN);
    const reply = makeReply();

    await guard(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it("returns 403 when the token belongs to a candidate", async () => {
    const guard = requireRoles(UserRole.TENANT_ADMIN);
    const request = { user: { type: "candidate", candidate_id: "cand-1" } } as unknown as FastifyRequest;
    const reply = makeReply();

    await guard(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
  });
});

describe("requireCandidate", () => {
  it("passes when the token belongs to a candidate", async () => {
    const request = { user: { type: "candidate", candidate_id: "cand-1" } } as unknown as FastifyRequest;
    const reply = makeReply();

    await requireCandidate(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it("returns 403 when the token belongs to a company user", async () => {
    const request = makeRequest(UserRole.TENANT_ADMIN);
    const reply = makeReply();

    await requireCandidate(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it("returns 403 when request.user is undefined", async () => {
    const request = { user: undefined } as unknown as FastifyRequest;
    const reply = makeReply();

    await requireCandidate(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
  });
});
