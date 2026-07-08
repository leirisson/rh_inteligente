import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildTestApp, makeAuthHeader } from "../test/helpers.js";
import { prisma } from "../lib/prisma.js";
import { createTenantWithAdmin } from "../modules/auth/auth.service.js";
import type { FastifyInstance } from "fastify";

vi.mock("../lib/embeddings.js", () => ({
  generateEmbedding: vi.fn().mockResolvedValue([1, ...new Array<number>(1535).fill(0)]),
}));

vi.mock("../lib/answer-evaluator.js", () => ({
  evaluateAnswer: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: vi.fn().mockResolvedValue({}) })) },
}));

import { evaluateAnswer } from "../lib/answer-evaluator.js";

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
  await prisma.skill.deleteMany();
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

async function signupCandidate(suffix: string) {
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

  await app.inject({
    method: "POST",
    url: "/candidates/me/contact-methods",
    headers: makeAuthHeader(candidate.accessToken),
    payload: { channel: "EMAIL", value: `candidate${suffix}@test.com` },
  });

  // Triggers resumeText/embedding generation, same effect the removed resumeText signup field had.
  await app.inject({
    method: "POST",
    url: "/candidates/me/skills",
    headers: makeAuthHeader(candidate.accessToken),
    payload: { name: "matching resume" },
  });

  return candidate;
}

describe("runScreeningAgent (via job activation)", () => {
  it("creates an Application and sends the initial contact when a job is activated", async () => {
    const tenant = await loginNewTenant("agent");

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

    await app.inject({
      method: "POST",
      url: `/jobs/${job.id}/screening-questions`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { question: "Why do you want this role?", order: 0, weight: 1 },
    });

    const candidate = await signupCandidate("agent");

    const activateRes = await app.inject({
      method: "PATCH",
      url: `/jobs/${job.id}/status`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { status: "ACTIVE" },
    });
    expect(activateRes.statusCode).toBe(200);

    const application = await prisma.application.findUnique({
      where: { candidateId_jobId: { candidateId: candidate.candidate.id, jobId: job.id } },
    });
    expect(application).not.toBeNull();
    expect(application?.status).toBe("IN_SCREENING");

    const conversations = await prisma.conversation.findMany({
      where: { applicationId: application?.id },
    });
    expect(conversations).toHaveLength(1);
    expect(conversations[0].sender).toBe("AGENT");
    expect(conversations[0].content).toBe("Why do you want this role?");

    const stages = await prisma.applicationStage.findMany({
      where: { applicationId: application?.id },
    });
    expect(stages.some((s) => s.status === "IN_SCREENING")).toBe(true);
  });

  it("does not create duplicate Applications when the job is activated more than once", async () => {
    const tenant = await loginNewTenant("agent-dup");

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

    await app.inject({
      method: "POST",
      url: `/jobs/${job.id}/screening-questions`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { question: "Why do you want this role?", order: 0, weight: 1 },
    });

    const candidate = await signupCandidate("agent-dup");

    await app.inject({
      method: "PATCH",
      url: `/jobs/${job.id}/status`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { status: "ACTIVE" },
    });

    await app.inject({
      method: "PATCH",
      url: `/jobs/${job.id}/status`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { status: "PAUSED" },
    });
    await app.inject({
      method: "PATCH",
      url: `/jobs/${job.id}/status`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { status: "ACTIVE" },
    });

    const applications = await prisma.application.findMany({
      where: { candidateId: candidate.candidate.id, jobId: job.id },
    });
    expect(applications).toHaveLength(1);
  });

  it("completes a full screening end-to-end and approves the candidate", async () => {
    const tenant = await loginNewTenant("agent-e2e-approve");

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

    await app.inject({
      method: "POST",
      url: `/jobs/${job.id}/screening-questions`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { question: "Why do you want this role?", order: 0, weight: 1 },
    });

    const candidate = await signupCandidate("agent-e2e-approve");

    // Job activation drives the full agent graph: findCandidates -> createApplications
    // -> sendInitialContact. From here the flow continues through the (simulated)
    // WhatsApp webhook endpoint, exactly like the real conversation would.
    await app.inject({
      method: "PATCH",
      url: `/jobs/${job.id}/status`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { status: "ACTIVE" },
    });

    const application = await prisma.application.findUniqueOrThrow({
      where: { candidateId_jobId: { candidateId: candidate.candidate.id, jobId: job.id } },
    });
    expect(application.status).toBe("IN_SCREENING");

    evaluateAnswerMock.mockResolvedValue({ score: 0.9, verdict: "PASS", reasoning: "Great fit" });

    const messageRes = await app.inject({
      method: "POST",
      url: `/applications/${application.id}/messages`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { content: "I love building backend systems" },
    });
    expect(messageRes.statusCode).toBe(200);
    expect(messageRes.json<{ status: string }>().status).toBe("APPROVED");

    const finalApplication = await prisma.application.findUniqueOrThrow({
      where: { id: application.id },
    });
    expect(finalApplication.status).toBe("APPROVED");

    const stages = await prisma.applicationStage.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: "asc" },
    });
    expect(stages.map((s) => s.status)).toEqual(["IN_SCREENING", "APPROVED"]);
  });

  it("completes a full screening end-to-end and rejects the candidate", async () => {
    const tenant = await loginNewTenant("agent-e2e-reject");

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

    await app.inject({
      method: "POST",
      url: `/jobs/${job.id}/screening-questions`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { question: "Why do you want this role?", order: 0, weight: 1 },
    });

    const candidate = await signupCandidate("agent-e2e-reject");

    await app.inject({
      method: "PATCH",
      url: `/jobs/${job.id}/status`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { status: "ACTIVE" },
    });

    const application = await prisma.application.findUniqueOrThrow({
      where: { candidateId_jobId: { candidateId: candidate.candidate.id, jobId: job.id } },
    });

    evaluateAnswerMock.mockResolvedValue({ score: 0.1, verdict: "FAIL", reasoning: "Poor fit" });

    const messageRes = await app.inject({
      method: "POST",
      url: `/applications/${application.id}/messages`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { content: "I don't really know" },
    });
    expect(messageRes.statusCode).toBe(200);
    expect(messageRes.json<{ status: string }>().status).toBe("REJECTED");

    const finalApplication = await prisma.application.findUniqueOrThrow({
      where: { id: application.id },
    });
    expect(finalApplication.status).toBe("REJECTED");
  });
});
