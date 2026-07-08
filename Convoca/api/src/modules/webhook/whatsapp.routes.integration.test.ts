import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildTestApp, makeAuthHeader } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import { createTenantWithAdmin } from "../auth/auth.service.js";
import type { FastifyInstance } from "fastify";

vi.mock("../../lib/embeddings.js", () => ({
  generateEmbedding: vi.fn().mockResolvedValue([1, ...new Array<number>(1535).fill(0)]),
}));

vi.mock("../../lib/answer-evaluator.js", () => ({
  evaluateAnswer: vi.fn().mockResolvedValue({ score: 0.9, verdict: "PASS", reasoning: "ok" }),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: vi.fn().mockResolvedValue({}) })) },
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await prisma.tenantIntegration.deleteMany();
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
  await prisma.tenantIntegration.deleteMany();
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
  const tenant = res.json<{ accessToken: string }>();
  const me = await prisma.user.findFirstOrThrow({ where: { email: `admin${suffix}@test.com` } });
  return { ...tenant, tenantId: me.tenantId };
}

async function setupApplicationInScreening(suffix: string, phone: string) {
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

  await app.inject({
    method: "POST",
    url: `/jobs/${job.id}/screening-questions`,
    headers: makeAuthHeader(tenant.accessToken),
    payload: { question: "Why do you want this role?", order: 0, weight: 1 },
  });

  const candidateRes = await app.inject({
    method: "POST",
    url: "/candidates/signup",
    payload: {
      name: `Candidate ${suffix}`,
      email: `candidate${suffix}@test.com`,
      password: "CandidatePass@123",
    },
  });
  const candidate = candidateRes.json<{ accessToken: string; candidate: { id: string } }>();

  await app.inject({
    method: "POST",
    url: "/candidates/me/contact-methods",
    headers: makeAuthHeader(candidate.accessToken),
    payload: { channel: "WHATSAPP", value: phone },
  });
  // Evolution API isn't configured in tests, so the agent's initial contact send falls
  // back to email — the candidate needs an EMAIL contact method too, or job activation
  // (which synchronously runs the screening agent) fails with 422.
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

function evolutionPayload(phone: string, text: string) {
  return {
    data: {
      key: { remoteJid: `${phone}@s.whatsapp.net`, fromMe: false },
      message: { conversation: text },
    },
  };
}

describe("POST /webhooks/whatsapp/:tenantId", () => {
  it("returns 401 when the webhook secret is missing or wrong", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/whatsapp/00000000-0000-0000-0000-000000000000",
      payload: evolutionPayload("5511999999999", "hello"),
    });
    expect(res.statusCode).toBe(401);

    const resWrongSecret = await app.inject({
      method: "POST",
      url: "/webhooks/whatsapp/00000000-0000-0000-0000-000000000000",
      headers: { "x-webhook-secret": "wrong" },
      payload: evolutionPayload("5511999999999", "hello"),
    });
    expect(resWrongSecret.statusCode).toBe(401);
  });

  it("processes an inbound message and progresses the screening flow", async () => {
    const phone = "5511988887777";
    const { tenant, application } = await setupApplicationInScreening("wh-ok", phone);

    const res = await app.inject({
      method: "POST",
      url: `/webhooks/whatsapp/${tenant.tenantId}`,
      headers: { "x-webhook-secret": "test-webhook-secret-value" },
      payload: evolutionPayload(phone, "I love building backend systems"),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ received: true });

    const conversations = await prisma.conversation.findMany({
      where: { applicationId: application.id },
    });
    expect(conversations.some((c) => c.sender === "CANDIDATE" && c.channel === "WHATSAPP")).toBe(
      true,
    );

    const updated = await prisma.application.findUniqueOrThrow({
      where: { id: application.id },
    });
    expect(updated.status).toBe("APPROVED");
  });

  it("acknowledges with 200 and no-ops when the candidate cannot be resolved", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/whatsapp/00000000-0000-0000-0000-000000000000",
      headers: { "x-webhook-secret": "test-webhook-secret-value" },
      payload: evolutionPayload("5500000000000", "unknown sender"),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ received: true });
  });

  it("transitions TenantIntegration to CONNECTED on a connection.update open event", async () => {
    const tenant = await loginNewTenant("wh-conn");
    const instanceName = `convoca_${tenant.tenantId}`;
    await prisma.tenantIntegration.create({
      data: { tenantId: tenant.tenantId, evolutionInstanceName: instanceName, status: "CONNECTING" },
    });

    const res = await app.inject({
      method: "POST",
      url: `/webhooks/whatsapp/${tenant.tenantId}`,
      headers: { "x-webhook-secret": "test-webhook-secret-value" },
      payload: {
        event: "connection.update",
        instance: instanceName,
        data: { state: "open", wuid: "5511987654321@s.whatsapp.net" },
      },
    });

    expect(res.statusCode).toBe(200);

    const integration = await prisma.tenantIntegration.findUniqueOrThrow({
      where: { tenantId: tenant.tenantId },
    });
    expect(integration.status).toBe("CONNECTED");
    expect(integration.connectedPhoneNumber).toBe("5511987654321");
    expect(integration.lastConnectedAt).not.toBeNull();
  });

  it("ignores a connection.update event whose instance doesn't match the tenant's integration", async () => {
    const tenant = await loginNewTenant("wh-conn-mismatch");
    await prisma.tenantIntegration.create({
      data: {
        tenantId: tenant.tenantId,
        evolutionInstanceName: `convoca_${tenant.tenantId}`,
        status: "CONNECTING",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/webhooks/whatsapp/${tenant.tenantId}`,
      headers: { "x-webhook-secret": "test-webhook-secret-value" },
      payload: {
        event: "connection.update",
        instance: "some_other_instance",
        data: { state: "open", wuid: "5511987654321@s.whatsapp.net" },
      },
    });

    expect(res.statusCode).toBe(200);

    const integration = await prisma.tenantIntegration.findUniqueOrThrow({
      where: { tenantId: tenant.tenantId },
    });
    expect(integration.status).toBe("CONNECTING");
  });
});
