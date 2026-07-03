import type {
  JobStatus,
  ApplicationStatus,
  IntegrationStatus,
  InterviewStatus,
} from "@/app/_lib/api/types";

export interface StatusStyle {
  label: string;
  bg: string;
  color: string;
}

const jobStatusMap: Record<JobStatus, StatusStyle> = {
  ACTIVE: { label: "Ativa", bg: "#ECFDF5", color: "#059669" },
  PAUSED: { label: "Pausada", bg: "#FFFBEB", color: "#D97706" },
  DRAFT: { label: "Rascunho", bg: "#F1F5F9", color: "#64748B" },
  CLOSED: { label: "Encerrada", bg: "#F1F5F9", color: "#94A3B8" },
};

const applicationStatusMap: Record<ApplicationStatus, StatusStyle> = {
  PENDING_CONTACT: { label: "Aguardando contato", bg: "#F1F5F9", color: "#64748B" },
  IN_SCREENING: { label: "Em triagem", bg: "#FFFBEB", color: "#D97706" },
  APPROVED: { label: "Aprovado", bg: "#ECFDF5", color: "#059669" },
  REJECTED: { label: "Reprovado", bg: "#FEF2F2", color: "#DC2626" },
  INTERVIEW_SCHEDULED: { label: "Entrevista agendada", bg: "#EEF2FF", color: "#4F46E5" },
  HIRED: { label: "Contratado", bg: "#ECFDF5", color: "#059669" },
  WITHDRAWN: { label: "Desistiu", bg: "#F1F5F9", color: "#94A3B8" },
};

const integrationStatusMap: Record<IntegrationStatus, StatusStyle> = {
  DISCONNECTED: { label: "Desconectado", bg: "#F1F5F9", color: "#64748B" },
  CONNECTING: { label: "Aguardando conexão", bg: "#FFFBEB", color: "#D97706" },
  CONNECTED: { label: "Conectado", bg: "#ECFDF5", color: "#059669" },
  ERROR: { label: "Erro", bg: "#FEF2F2", color: "#DC2626" },
};

const interviewStatusMap: Record<InterviewStatus, StatusStyle> = {
  SCHEDULED: { label: "Agendada", bg: "#ECFDF5", color: "#059669" },
  RESCHEDULED: { label: "Reagendada", bg: "#FFFBEB", color: "#D97706" },
  CANCELLED: { label: "Cancelada", bg: "#F1F5F9", color: "#94A3B8" },
};

export function getJobStatusStyle(status: JobStatus): StatusStyle {
  return jobStatusMap[status];
}

export function getApplicationStatusStyle(status: ApplicationStatus | string): StatusStyle {
  return (
    applicationStatusMap[status as ApplicationStatus] ?? {
      label: status,
      bg: "#F1F5F9",
      color: "#64748B",
    }
  );
}

export function getIntegrationStatusStyle(status: IntegrationStatus): StatusStyle {
  return integrationStatusMap[status];
}

export function getInterviewStatusStyle(status: InterviewStatus): StatusStyle {
  return interviewStatusMap[status];
}
