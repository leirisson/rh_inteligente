import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildTestApp, makeAuthHeader } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import { createTenantWithAdmin } from "../auth/auth.service.js";
import type { FastifyInstance } from "fastify";

vi.mock("../../lib/embeddings.js", () => ({
  generateEmbedding: vi.fn().mockResolvedValue([1, ...new Array<number>(1535).fill(0)]),
}));

const sendMailMock = vi.fn().mockResolvedValue({});
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock })) },
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await prisma.interviewSchedule.deleteMany();
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
  sendMailMock.mockClear();
  await prisma.interviewSchedule.deleteMany();
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

async function setupApplicationWithStatus(suffix: string, status: string) {
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

  const candidateRes = await app.inject({
    method: "POST",
    url: "/candidates/signup",
    payload: {
      name: `Candidate ${suffix}`,
      email: `candidate${suffix}@test.com`,
      password: "CandidatePass@123",
      resumeText: "matching resume",
    },
  });
  const candidate = candidateRes.json<{ accessToken: string; candidate: { id: string } }>();

  await app.inject({
    method: "POST",
    url: "/candidates/me/contact-methods",
    headers: makeAuthHeader(candidate.accessToken),
    payload: { channel: "EMAIL", value: `candidate${suffix}@test.com` },
  });

  const application = await prisma.application.create({
    data: { candidateId: candidate.candidate.id, jobId: job.id, status: status as never },
  });

  return { tenant, job, candidate, application };
}

describe("Interview scheduling", () => {
  it("rejects scheduling for an application that is not APPROVED", async () => {
    const { tenant, application } = await setupApplicationWithStatus(
      "sched-invalid",
      "PENDING_CONTACT",
    );

    const res = await app.inject({
      method: "POST",
      url: `/applications/${application.id}/interviews`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: { scheduledAt: new Date(Date.now() + 86_400_000).toISOString() },
    });

    expect(res.statusCode).toBe(422);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("INVALID_APPLICATION_TRANSITION");
  });

  it("schedules an interview, reschedules it, then cancels it", async () => {
    const { tenant, application } = await setupApplicationWithStatus("sched-flow", "APPROVED");

    const scheduleRes = await app.inject({
      method: "POST",
      url: `/applications/${application.id}/interviews`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: {
        scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
        location: "Office A",
      },
    });
    expect(scheduleRes.statusCode).toBe(201);
    expect(sendMailMock).toHaveBeenCalled();

    const afterSchedule = await prisma.application.findUniqueOrThrow({
      where: { id: application.id },
    });
    expect(afterSchedule.status).toBe("INTERVIEW_SCHEDULED");

    sendMailMock.mockClear();
    const rescheduleRes = await app.inject({
      method: "PATCH",
      url: `/applications/${application.id}/interviews/reschedule`,
      headers: makeAuthHeader(tenant.accessToken),
      payload: {
        scheduledAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
        location: "Office B",
      },
    });
    expect(rescheduleRes.statusCode).toBe(200);
    expect(sendMailMock).toHaveBeenCalled();

    const interviews = await prisma.interviewSchedule.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: "asc" },
    });
    expect(interviews).toHaveLength(2);
    expect(interviews[0].status).toBe("RESCHEDULED");
    expect(interviews[1].status).toBe("SCHEDULED");

    sendMailMock.mockClear();
    const cancelRes = await app.inject({
      method: "PATCH",
      url: `/applications/${application.id}/interviews/cancel`,
      headers: makeAuthHeader(tenant.accessToken),
    });
    expect(cancelRes.statusCode).toBe(200);
    expect(sendMailMock).toHaveBeenCalled();

    const afterCancel = await prisma.application.findUniqueOrThrow({
      where: { id: application.id },
    });
    expect(afterCancel.status).toBe("APPROVED");

    const cancelledInterview = await prisma.interviewSchedule.findFirst({
      where: { applicationId: application.id, status: "CANCELLED" },
    });
    expect(cancelledInterview).not.toBeNull();
  });
});
