import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildTestApp, makeAuthHeader } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import { createTenantWithAdmin } from "../auth/auth.service.js";
import type { FastifyInstance } from "fastify";

vi.mock("../../lib/embeddings.js", () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0)),
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await prisma.contactMethod.deleteMany();
  await prisma.workExperience.deleteMany();
  await prisma.education.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.candidateLanguage.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  await prisma.contactMethod.deleteMany();
  await prisma.workExperience.deleteMany();
  await prisma.education.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.candidateLanguage.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
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

describe("POST /candidates/signup", () => {
  it("creates a candidate without any tenant and returns tokens", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/candidates/signup",
      payload: { name: "Jane Doe", email: "jane@test.com", password: "JanePass@123" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{
      accessToken: string;
      refreshToken: string;
      candidate: { id: string; name: string };
    }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.candidate.name).toBe("Jane Doe");
  });

  it("returns 409 when the email is already in use", async () => {
    await signup("dup");

    const res = await app.inject({
      method: "POST",
      url: "/candidates/signup",
      payload: { name: "Other Name", email: "candidatedup@test.com", password: "OtherPass@123" },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("EMAIL_TAKEN");
  });

  it("never leaks the password hash in the response", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/candidates/signup",
      payload: { name: "Jane Doe", email: "janehash@test.com", password: "JanePass@123" },
    });

    expect(res.body).not.toContain("passwordHash");
    expect(res.body).not.toContain("$argon2");
  });
});

describe("POST /candidates/login", () => {
  it("logs in with valid credentials", async () => {
    await signup("login");

    const res = await app.inject({
      method: "POST",
      url: "/candidates/login",
      payload: { email: "candidatelogin@test.com", password: "CandidatePass@123" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string }>();
    expect(body.accessToken).toBeTruthy();
  });

  it("returns 401 with wrong password", async () => {
    await signup("wrongpw");

    const res = await app.inject({
      method: "POST",
      url: "/candidates/login",
      payload: { email: "candidatewrongpw@test.com", password: "WrongPass@123" },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe("candidate isolation from company routes", () => {
  it("a candidate token cannot access tenant-scoped job routes", async () => {
    const candidate = await signup("iso");

    const res = await app.inject({
      method: "POST",
      url: "/jobs",
      headers: makeAuthHeader(candidate.accessToken),
      payload: { title: "Hijack", description: "desc" },
    });

    expect(res.statusCode).toBe(403);
  });

  it("a company token cannot access candidate-only routes", async () => {
    await createTenantWithAdmin("Tenant Iso", "iso-admin@test.com", "Admin", "AdminPass@123");
    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "iso-admin@test.com", password: "AdminPass@123" },
    });
    const { accessToken } = loginRes.json<{ accessToken: string }>();

    const res = await app.inject({
      method: "GET",
      url: "/candidates/me",
      headers: makeAuthHeader(accessToken),
    });

    expect(res.statusCode).toBe(403);
  });
});

describe("contact methods", () => {
  it("a candidate can register multiple contact methods", async () => {
    const candidate = await signup("contacts");

    const whatsapp = await app.inject({
      method: "POST",
      url: "/candidates/me/contact-methods",
      headers: makeAuthHeader(candidate.accessToken),
      payload: { channel: "WHATSAPP", value: "+5511999999999" },
    });
    expect(whatsapp.statusCode).toBe(201);

    const email = await app.inject({
      method: "POST",
      url: "/candidates/me/contact-methods",
      headers: makeAuthHeader(candidate.accessToken),
      payload: { channel: "EMAIL", value: "contact@test.com" },
    });
    expect(email.statusCode).toBe(201);

    const listRes = await app.inject({
      method: "GET",
      url: "/candidates/me/contact-methods",
      headers: makeAuthHeader(candidate.accessToken),
    });
    const list = listRes.json<{ channel: string }[]>();
    expect(list).toHaveLength(2);
  });
});

describe("GET /candidates/me/applications", () => {
  it("returns an empty list for a candidate with no applications", async () => {
    const candidate = await signup("apps");

    const res = await app.inject({
      method: "GET",
      url: "/candidates/me/applications",
      headers: makeAuthHeader(candidate.accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(body).toEqual([]);
  });
});

describe("unauthenticated access", () => {
  it("returns 401 without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/candidates/me" });
    expect(res.statusCode).toBe(401);
  });
});
