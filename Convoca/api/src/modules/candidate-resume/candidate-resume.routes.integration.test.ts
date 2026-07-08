import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildTestApp, makeAuthHeader } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import type { FastifyInstance } from "fastify";

vi.mock("../../lib/embeddings.js", () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0)),
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await prisma.workExperience.deleteMany();
  await prisma.education.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.candidateLanguage.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  await prisma.workExperience.deleteMany();
  await prisma.education.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.candidateLanguage.deleteMany();
  await prisma.candidate.deleteMany();
});

async function signup(suffix: string) {
  const res = await app.inject({
    method: "POST",
    url: "/candidates/signup",
    payload: {
      name: `Candidate ${suffix}`,
      email: `candidate${suffix}@test.com`,
      password: "CandidatePass@123",
    },
  });
  return res.json<{ accessToken: string; candidate: { id: string } }>();
}

describe("work experiences", () => {
  it("creates, lists and deletes a work experience", async () => {
    const candidate = await signup("workexp");

    const createRes = await app.inject({
      method: "POST",
      url: "/candidates/me/work-experiences",
      headers: makeAuthHeader(candidate.accessToken),
      payload: {
        company: "Acme Corp",
        role: "Engenheiro de Software",
        description: "Backend em Node.js",
        startDate: "2022-01-01",
        isCurrent: true,
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json<{ id: string; company: string }>();

    const listRes = await app.inject({
      method: "GET",
      url: "/candidates/me/work-experiences",
      headers: makeAuthHeader(candidate.accessToken),
    });
    expect(listRes.json<unknown[]>()).toHaveLength(1);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/candidates/me/work-experiences/${created.id}`,
      headers: makeAuthHeader(candidate.accessToken),
    });
    expect(deleteRes.statusCode).toBe(204);

    const listAfterDelete = await app.inject({
      method: "GET",
      url: "/candidates/me/work-experiences",
      headers: makeAuthHeader(candidate.accessToken),
    });
    expect(listAfterDelete.json<unknown[]>()).toHaveLength(0);
  });
});

describe("educations", () => {
  it("creates, lists and deletes an education entry", async () => {
    const candidate = await signup("education");

    const createRes = await app.inject({
      method: "POST",
      url: "/candidates/me/educations",
      headers: makeAuthHeader(candidate.accessToken),
      payload: {
        institution: "Universidade Federal",
        course: "Ciência da Computação",
        level: "Graduação",
        startDate: "2018-02-01",
        endDate: "2022-12-01",
        isCurrent: false,
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json<{ id: string }>();

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/candidates/me/educations/${created.id}`,
      headers: makeAuthHeader(candidate.accessToken),
    });
    expect(deleteRes.statusCode).toBe(204);
  });
});

describe("skills", () => {
  it("creates, lists and deletes a skill", async () => {
    const candidate = await signup("skill");

    const createRes = await app.inject({
      method: "POST",
      url: "/candidates/me/skills",
      headers: makeAuthHeader(candidate.accessToken),
      payload: { name: "TypeScript" },
    });
    expect(createRes.statusCode).toBe(201);

    const listRes = await app.inject({
      method: "GET",
      url: "/candidates/me/skills",
      headers: makeAuthHeader(candidate.accessToken),
    });
    expect(listRes.json<{ name: string }[]>()[0]?.name).toBe("TypeScript");
  });
});

describe("languages", () => {
  it("creates, lists and deletes a language", async () => {
    const candidate = await signup("language");

    const createRes = await app.inject({
      method: "POST",
      url: "/candidates/me/languages",
      headers: makeAuthHeader(candidate.accessToken),
      payload: { name: "Inglês", proficiency: "ADVANCED" },
    });
    expect(createRes.statusCode).toBe(201);

    const listRes = await app.inject({
      method: "GET",
      url: "/candidates/me/languages",
      headers: makeAuthHeader(candidate.accessToken),
    });
    expect(listRes.json<{ proficiency: string }[]>()[0]?.proficiency).toBe("ADVANCED");
  });
});

describe("GET /candidates/me/resume", () => {
  it("aggregates all four sections", async () => {
    const candidate = await signup("resume");

    await app.inject({
      method: "POST",
      url: "/candidates/me/skills",
      headers: makeAuthHeader(candidate.accessToken),
      payload: { name: "Go" },
    });
    await app.inject({
      method: "POST",
      url: "/candidates/me/languages",
      headers: makeAuthHeader(candidate.accessToken),
      payload: { name: "Espanhol", proficiency: "BASIC" },
    });

    const res = await app.inject({
      method: "GET",
      url: "/candidates/me/resume",
      headers: makeAuthHeader(candidate.accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{
      workExperiences: unknown[];
      educations: unknown[];
      skills: unknown[];
      languages: unknown[];
    }>();
    expect(body.workExperiences).toEqual([]);
    expect(body.educations).toEqual([]);
    expect(body.skills).toHaveLength(1);
    expect(body.languages).toHaveLength(1);
  });
});

describe("resumeText regeneration", () => {
  it("populates candidate.resumeText from structured sections after a create", async () => {
    const candidate = await signup("regen");

    await app.inject({
      method: "POST",
      url: "/candidates/me/skills",
      headers: makeAuthHeader(candidate.accessToken),
      payload: { name: "Python" },
    });

    const me = await app.inject({
      method: "GET",
      url: "/candidates/me",
      headers: makeAuthHeader(candidate.accessToken),
    });
    const body = me.json<{ resumeText: string | null }>();
    expect(body.resumeText).toContain("Python");
  });

  it("clears resumeText after the last section item is deleted", async () => {
    const candidate = await signup("regenclear");

    const createRes = await app.inject({
      method: "POST",
      url: "/candidates/me/skills",
      headers: makeAuthHeader(candidate.accessToken),
      payload: { name: "Rust" },
    });
    const created = createRes.json<{ id: string }>();

    await app.inject({
      method: "DELETE",
      url: `/candidates/me/skills/${created.id}`,
      headers: makeAuthHeader(candidate.accessToken),
    });

    const me = await app.inject({
      method: "GET",
      url: "/candidates/me",
      headers: makeAuthHeader(candidate.accessToken),
    });
    const body = me.json<{ resumeText: string | null }>();
    expect(body.resumeText).toBeNull();
  });
});

describe("candidate isolation", () => {
  it("a candidate cannot delete another candidate's work experience", async () => {
    const candidateA = await signup("isoA");
    const candidateB = await signup("isoB");

    const createRes = await app.inject({
      method: "POST",
      url: "/candidates/me/work-experiences",
      headers: makeAuthHeader(candidateA.accessToken),
      payload: {
        company: "Acme",
        role: "Dev",
        startDate: "2020-01-01",
        isCurrent: true,
      },
    });
    const created = createRes.json<{ id: string }>();

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/candidates/me/work-experiences/${created.id}`,
      headers: makeAuthHeader(candidateB.accessToken),
    });

    expect(deleteRes.statusCode).toBe(404);
  });
});

describe("unauthenticated access", () => {
  it("returns 401 without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/candidates/me/resume" });
    expect(res.statusCode).toBe(401);
  });
});
