import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { buildTransitionOperations } from "../../lib/application-transition.js";
import { combinedContactChannel } from "../../lib/contact-channel.js";
import type { ScheduleInterviewBody, RescheduleInterviewBody } from "./interview.schema.js";

function applicationNotFoundError() {
  return Object.assign(new Error("Application not found"), {
    statusCode: 404,
    code: "APPLICATION_NOT_FOUND",
  });
}

function interviewNotFoundError() {
  return Object.assign(new Error("No active interview for this application"), {
    statusCode: 404,
    code: "INTERVIEW_NOT_FOUND",
  });
}

async function assertApplicationInTenant(tenantId: string, applicationId: string) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, job: { tenantId } },
  });
  if (!application) throw applicationNotFoundError();
  return application;
}

async function getActiveInterview(applicationId: string) {
  return prisma.interviewSchedule.findFirst({
    where: { applicationId, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
  });
}

function formatInterviewMessage(scheduledAt: Date, location?: string | null): string {
  const when = scheduledAt.toLocaleString("pt-BR");
  return location
    ? `Sua entrevista foi agendada para ${when} em ${location}.`
    : `Sua entrevista foi agendada para ${when}.`;
}

export async function scheduleInterview(
  tenantId: string,
  applicationId: string,
  body: ScheduleInterviewBody,
) {
  const application = await assertApplicationInTenant(tenantId, applicationId);

  const [applicationUpdate, stageInsert] = buildTransitionOperations(
    application.status,
    applicationId,
    ApplicationStatus.INTERVIEW_SCHEDULED,
  );

  const [, , interview] = await prisma.$transaction([
    applicationUpdate,
    stageInsert,
    prisma.interviewSchedule.create({
      data: {
        applicationId,
        status: "SCHEDULED",
        scheduledAt: body.scheduledAt,
        location: body.location,
        notes: body.notes,
      },
    }),
  ]);

  await combinedContactChannel.send(
    applicationId,
    "WHATSAPP",
    formatInterviewMessage(interview.scheduledAt, interview.location),
  );

  return interview;
}

export async function rescheduleInterview(
  tenantId: string,
  applicationId: string,
  body: RescheduleInterviewBody,
) {
  await assertApplicationInTenant(tenantId, applicationId);

  const current = await getActiveInterview(applicationId);
  if (!current) throw interviewNotFoundError();

  const [, created] = await prisma.$transaction([
    prisma.interviewSchedule.update({
      where: { id: current.id },
      data: { status: "RESCHEDULED" },
    }),
    prisma.interviewSchedule.create({
      data: {
        applicationId,
        status: "SCHEDULED",
        scheduledAt: body.scheduledAt,
        location: body.location,
        notes: body.notes,
      },
    }),
  ]);

  await combinedContactChannel.send(
    applicationId,
    "WHATSAPP",
    `Sua entrevista foi reagendada. ${formatInterviewMessage(created.scheduledAt, created.location)}`,
  );

  return created;
}

export async function cancelInterview(tenantId: string, applicationId: string) {
  const application = await assertApplicationInTenant(tenantId, applicationId);

  const current = await getActiveInterview(applicationId);
  if (!current) throw interviewNotFoundError();

  const transitionOps = buildTransitionOperations(
    application.status,
    applicationId,
    ApplicationStatus.APPROVED,
    "Interview cancelled",
  );

  const [updated] = await prisma.$transaction([
    prisma.interviewSchedule.update({
      where: { id: current.id },
      data: { status: "CANCELLED" },
    }),
    ...transitionOps,
  ]);

  await combinedContactChannel.send(
    applicationId,
    "WHATSAPP",
    "Sua entrevista foi cancelada. Entraremos em contato para reagendar.",
  );

  return updated;
}
