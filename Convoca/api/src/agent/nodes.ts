import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getJobMatches } from "../modules/matching/matching.service.js";
import { combinedContactChannel } from "../lib/contact-channel.js";
import { transitionApplication } from "../lib/application-transition.js";
import type { AgentStateType, AgentApplication } from "./state.js";

export async function findCandidates(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const matches = await getJobMatches(state.tenantId, state.jobId, state.threshold);

  const existing = await prisma.application.findMany({
    where: { jobId: state.jobId, candidateId: { in: matches.map((m) => m.candidateId) } },
    select: { candidateId: true },
  });
  const existingIds = new Set(existing.map((a) => a.candidateId));

  return { matches: matches.filter((m) => !existingIds.has(m.candidateId)) };
}

export async function createApplications(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const applications: AgentApplication[] = [];

  for (const match of state.matches) {
    try {
      const application = await prisma.application.create({
        data: {
          candidateId: match.candidateId,
          jobId: state.jobId,
          status: ApplicationStatus.PENDING_CONTACT,
        },
      });
      applications.push({ applicationId: application.id, candidateId: match.candidateId });
    } catch (error) {
      const isDuplicate =
        error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002";
      if (!isDuplicate) throw error;
    }
  }

  return { applications };
}

export async function sendInitialContact(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const firstQuestion = await prisma.screeningQuestion.findFirst({
    where: { jobId: state.jobId },
    orderBy: { order: "asc" },
  });

  if (!firstQuestion) return {};

  for (const application of state.applications) {
    await combinedContactChannel.send(
      application.applicationId,
      "WHATSAPP",
      firstQuestion.question,
    );

    await transitionApplication(
      application.applicationId,
      ApplicationStatus.IN_SCREENING,
      "Initial contact sent by screening agent",
    );
  }

  return {};
}
