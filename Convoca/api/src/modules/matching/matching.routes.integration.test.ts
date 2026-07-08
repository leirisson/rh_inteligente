import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildTestApp, makeAuthHeader } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import { createTenantWithAdmin } from "../auth/auth.service.js";
import type { FastifyInstance } from "fastify";

// Deterministic embeddings keyed by input text so similarity ordering is predictable:
// requirement embedding = unit vector on axis 0; a "close" candidate embedding is
// mostly axis 0 (high cosine similarity), a "far" candidate is mostly axis 1 (low similarity).
const ZERO_PADDING: number[] = new Array<number>(1534).fill(0);
const REQUIREMENT_VECTOR = [1, 0, ...ZERO_PADDING];
const CLOSE_CANDIDATE_VECTOR = [0.9, 0.1, ...ZERO_PADDING];
const FAR_CANDIDATE_VECTOR = [0.1, 0.9, ...ZERO_PADDING];

vi.mock("../../lib/embeddings.js", () => ({
  generateEmbedding: vi.fn((text: string) => {
    if (text.includes("REQUIREMENT")) return Promise.resolve(REQUIREMENT_VECTOR);
    if (text.includes("CLOSE")) return Promise.resolve(CLOSE_CANDIDATE_VECTOR);
    return Promise.resolve(FAR_CANDIDATE_VECTOR);
  }),
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await prisma.screeningQuestion.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.job.deleteMany();
  await prisma.contactMethod.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  await prisma.screeningQuestion.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.job.deleteMany();
  await prisma.contactMethod.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
});

async function loginNewTenant(suffix: string) {
  await createTenantWithAdmin(
    `Tenant ${suffix}`,
    `admin${suffix}@test.com`,
    `Admin ${suffix}`,
    "AdminPass@123",
  );
  const res = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: `admin${suffix}@test.com`, password: "AdminPass@123" },
  });
  return res.json<{ accessToken: string }>();
}

async function signupCandidate(suffix: string, resumeText: string) {
  const res = await app.inject({
    method: "POST",
    url: "/candidates/signup",
    payload: {
      name: `Candidate ${suffix}`,
      email: `candidate${suffix}@test.com`,
      password: "CandidatePass@123",
    },
  });
  const candidate = res.json<{ accessToken: string; candidate: { id: string } }>();

  // Triggers resumeText/embedding generation, same effect the removed resumeText signup field had.
  await app.inject({
    method: "POST",
    url: "/candidates/me/skills",
    headers: makeAuthHeader(candidate.accessToken),
    payload: { name: resumeText },
  });

  return candidate;
}

describe("GET /jobs/:jobId/matches", () => {
  it("ranks candidates by average cosine similarity across job requirements", async () => {
    const tenant = await loginNewTenant("match");

    const jobRes = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(tenant.accessToken),
      payload: { title: "Backend Engineer", description: "desc" },
    });
    const job = jobRes.json<{ id: string }>();

    await app.inject({
      method: "POST",
      url: `/jobs/${job.id}/requirements`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { text: "REQUIREMENT: 5 years TypeScript" },
    });

    const close = await signupCandidate("close", "CLOSE match resume");
    const far = await signupCandidate("far", "FAR match resume");

    const res = await app.inject({
      method: "GET",
      url: `/jobs/${job.id}/matches`,
      headers: makeAuthHeader(tenant.accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ candidateId: string; score: number }[]>();
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].candidateId).toBe(close.candidate.id);

    const farEntry = body.find((m) => m.candidateId === far.candidate.id);
    if (farEntry) {
      expect(body[0].score).toBeGreaterThan(farEntry.score);
    }
  });

  it("excludes candidates below the similarity threshold", async () => {
    const tenant = await loginNewTenant("thresh");

    const jobRes = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(tenant.accessToken),
      payload: { title: "Backend Engineer", description: "desc" },
    });
    const job = jobRes.json<{ id: string }>();

    await app.inject({
      method: "POST",
      url: `/jobs/${job.id}/requirements`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { text: "REQUIREMENT: 5 years TypeScript" },
    });

    await signupCandidate("far2", "FAR match resume");

    const res = await app.inject({
      method: "GET",
      url: `/jobs/${job.id}/matches?threshold=0.95`,
      headers: makeAuthHeader(tenant.accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ candidateId: string }[]>();
    expect(body).toHaveLength(0);
  });

  it("returns 404 for a job outside the tenant", async () => {
    const tenantA = await loginNewTenant("matcha");
    const tenantB = await loginNewTenant("matchb");

    const jobRes = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(tenantA.accessToken),
      payload: { title: "Backend Engineer", description: "desc" },
    });
    const job = jobRes.json<{ id: string }>();

    const res = await app.inject({
      method: "GET",
      url: `/jobs/${job.id}/matches`,
      headers: makeAuthHeader(tenantB.accessToken),
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/jobs/00000000-0000-0000-0000-000000000000/matches",
    });
    expect(res.statusCode).toBe(401);
  });
});
