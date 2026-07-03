import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildTestApp, makeAuthHeader } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import { createTenantWithAdmin } from "../auth/auth.service.js";
import type { FastifyInstance } from "fastify";

vi.mock("../../lib/embeddings.js", () => ({
  generateEmbedding: vi.fn().mockResolvedValue([1, ...new Array<number>(1535).fill(0)]),
}));

vi.mock("../../lib/answer-evaluator.js", () => ({
  evaluateAnswer: vi.fn(),
}));

const sendMailMock = vi
  .fn<(mail: { from: string; to: string; subject: string; text: string }) => Promise<unknown>>()
  .mockResolvedValue({});
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock })) },
}));

import { evaluateAnswer } from "../../lib/answer-evaluator.js";

const evaluateAnswerMock = evaluateAnswer as unknown as ReturnType<typeof vi.fn>;

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await prisma.conversation.deleteMany();
  await prisma.applicationStage.deleteMany();
  await prisma.screeningAnswer.deleteMany();
  await prisma.application.deleteMany();
  await prisma.screeningQuestion.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.job.deleteMany();
  await prisma.contactMethod.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  evaluateAnswerMock.mockReset();
  await prisma.conversation.deleteMany();
  await prisma.applicationStage.deleteMany();
  await prisma.screeningAnswer.deleteMany();
  await prisma.application.deleteMany();
  await prisma.screeningQuestion.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.job.deleteMany();
  await prisma.contactMethod.deleteMany();
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

async function signupCandidate(suffix: string) {
  const res = await app.inject({
    method: "POST",
    url: "/candidates/signup",
    payload: {
      name: `Candidate ${suffix}`,
      email: `candidate${suffix}@test.com`,
      password: "CandidatePass@123",
      resumeText: "matching resume",
    },
  });
  const candidate = res.json<{ accessToken: string; candidate: { id: string } }>();

  await app.inject({
    method: "POST",
    url: "/candidates/me/contact-methods",
    headers: makeAuthHeader(candidate.accessToken),
    payload: { channel: "EMAIL", value: `candidate${suffix}@test.com` },
  });

  return candidate;
}

async function setupActiveJobWithApplication(
  suffix: string,
  questions: { question: string; expectedAnswer?: string; order: number; weight: number }[],
) {
  const tenant = await loginNewTenant(suffix);

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
    payload: { text: "5 years TypeScript" },
  });

  for (const q of questions) {
    await app.inject({
      method: "POST",
      url: `/jobs/${job.id}/screening-questions`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: q,
    });
  }

  const candidate = await signupCandidate(suffix);

  await app.inject({
    method: "PATCH",
    url: `/jobs/${job.id}/status`,
    headers: makeAuthHeader(tenant.accessToken),
    payload: { status: "ACTIVE" },
  });

  const application = await prisma.application.findUniqueOrThrow({
    where: { candidateId_jobId: { candidateId: candidate.candidate.id, jobId: job.id } },
  });

  return { tenant, job, candidate, application };
}

describe("POST /applications/:id/messages", () => {
  it("approves the candidate when the weighted score is above the passing threshold", async () => {
    const { tenant, application } = await setupActiveJobWithApplication("approve", [
      { question: "Why do you want this role?", order: 0, weight: 1 },
    ]);

    evaluateAnswerMock.mockResolvedValue({ score: 0.9, verdict: "PASS", reasoning: "Great fit" });

    const res = await app.inject({
      method: "POST",
      url: `/applications/${application.id}/messages`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { content: "I love building backend systems" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string }>();
    expect(body.status).toBe("APPROVED");

    const stages = await prisma.applicationStage.findMany({
      where: { applicationId: application.id },
    });
    expect(stages.some((s) => s.status === "APPROVED")).toBe(true);

    const conversations = await prisma.conversation.findMany({
      where: { applicationId: application.id },
    });
    expect(conversations.some((c) => c.sender === "CANDIDATE")).toBe(true);

    // notifyRecruitersOnApproval is fire-and-forget (runs after the response is sent);
    // wait briefly for its DB queries + sendMail call to settle.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const approvalMail = sendMailMock.mock.calls.find((call) =>
      call[0].subject.includes("Candidato aprovado"),
    );
    expect(approvalMail).toBeDefined();
  });

  it("rejects the candidate when the weighted score is below the passing threshold", async () => {
    const { tenant, application } = await setupActiveJobWithApplication("reject", [
      { question: "Why do you want this role?", order: 0, weight: 1 },
    ]);

    evaluateAnswerMock.mockResolvedValue({ score: 0.1, verdict: "FAIL", reasoning: "Poor fit" });

    const res = await app.inject({
      method: "POST",
      url: `/applications/${application.id}/messages`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { content: "I don't know" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string }>();
    expect(body.status).toBe("REJECTED");
  });

  it("sends the next question and keeps the application in screening when more questions remain", async () => {
    const { tenant, application } = await setupActiveJobWithApplication("multi", [
      { question: "First question?", order: 0, weight: 1 },
      { question: "Second question?", order: 1, weight: 1 },
    ]);

    evaluateAnswerMock.mockResolvedValue({ score: 0.9, verdict: "PASS", reasoning: "Good" });

    const res = await app.inject({
      method: "POST",
      url: `/applications/${application.id}/messages`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { content: "answer to first question" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string }>();
    expect(body.status).toBe("IN_SCREENING");

    const conversations = await prisma.conversation.findMany({
      where: { applicationId: application.id },
      orderBy: { sentAt: "asc" },
    });
    expect(conversations.at(-1)?.content).toBe("Second question?");
  });

  it("returns 404 for an application outside the tenant", async () => {
    const { application } = await setupActiveJobWithApplication("iso-a", [
      { question: "Why do you want this role?", order: 0, weight: 1 },
    ]);
    const otherTenant = await loginNewTenant("iso-b");

    const res = await app.inject({
      method: "POST",
      url: `/applications/${application.id}/messages`,
      headers: makeAuthHeader(otherTenant.accessToken),
      payload: { content: "hijack attempt" },
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/applications/00000000-0000-0000-0000-000000000000/messages",
      payload: { content: "hi" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /jobs/:jobId/funnel", () => {
  it("returns zero-filled counts per status for the job", async () => {
    const { tenant, job, application } = await setupActiveJobWithApplication("funnel", [
      { question: "Why do you want this role?", order: 0, weight: 1 },
    ]);

    evaluateAnswerMock.mockResolvedValue({ score: 0.9, verdict: "PASS", reasoning: "Great fit" });
    await app.inject({
      method: "POST",
      url: `/applications/${application.id}/messages`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { content: "I love building backend systems" },
    });

    const res = await app.inject({
      method: "GET",
      url: `/jobs/${job.id}/funnel`,
      headers: makeAuthHeader(tenant.accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, number>>();
    expect(body).toMatchObject({
      PENDING_CONTACT: 0,
      IN_SCREENING: 0,
      APPROVED: 1,
      REJECTED: 0,
      INTERVIEW_SCHEDULED: 0,
      HIRED: 0,
      WITHDRAWN: 0,
    });
  });

  it("returns 404 for a job outside the tenant", async () => {
    const { job } = await setupActiveJobWithApplication("funnel-iso", [
      { question: "Why do you want this role?", order: 0, weight: 1 },
    ]);
    const otherTenant = await loginNewTenant("funnel-iso-b");

    const res = await app.inject({
      method: "GET",
      url: `/jobs/${job.id}/funnel`,
      headers: makeAuthHeader(otherTenant.accessToken),
    });

    expect(res.statusCode).toBe(404);
  });
});
