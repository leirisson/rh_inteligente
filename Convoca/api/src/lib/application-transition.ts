import { ApplicationStatus } from "@prisma/client";
import { prisma } from "./prisma.js";
import { notifyRecruitersOnApproval } from "./notification.js";

export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  PENDING_CONTACT: [ApplicationStatus.IN_SCREENING, ApplicationStatus.WITHDRAWN],
  IN_SCREENING: [
    ApplicationStatus.APPROVED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  APPROVED: [
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  INTERVIEW_SCHEDULED: [
    ApplicationStatus.APPROVED,
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function invalidTransitionError(from: ApplicationStatus, to: ApplicationStatus) {
  return Object.assign(new Error(`Cannot transition application from ${from} to ${to}`), {
    statusCode: 422,
    code: "INVALID_APPLICATION_TRANSITION",
  });
}

function applicationNotFoundError() {
  return Object.assign(new Error("Application not found"), {
    statusCode: 404,
    code: "APPLICATION_NOT_FOUND",
  });
}

export function buildTransitionOperations(
  currentStatus: ApplicationStatus,
  applicationId: string,
  newStatus: ApplicationStatus,
  note?: string,
) {
  if (!isValidTransition(currentStatus, newStatus)) {
    throw invalidTransitionError(currentStatus, newStatus);
  }

  return [
    prisma.application.update({ where: { id: applicationId }, data: { status: newStatus } }),
    prisma.applicationStage.create({
      data: { applicationId, status: newStatus, note },
    }),
  ];
}

export async function transitionApplication(
  applicationId: string,
  newStatus: ApplicationStatus,
  note?: string,
) {
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) throw applicationNotFoundError();

  const [updated] = await prisma.$transaction(
    buildTransitionOperations(application.status, applicationId, newStatus, note),
  );

  if (newStatus === ApplicationStatus.APPROVED) {
    notifyRecruitersOnApproval(applicationId).catch((error: unknown) => {
      console.error("Failed to notify recruiters on approval:", error);
    });
  }

  return updated;
}
