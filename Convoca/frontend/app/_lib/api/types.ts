// Tipos espelhando os schemas Zod de Convoca/api/src/modules/**/*.schema.ts.
// Manter em sincronia manualmente — não há geração automática nesta fase.

export type UserRole = "SUPER_ADMIN" | "TENANT_ADMIN" | "RECRUITER" | "DEPARTMENT_LEAD";
export type JobStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
export type ApplicationStatus =
  | "PENDING_CONTACT"
  | "IN_SCREENING"
  | "APPROVED"
  | "REJECTED"
  | "INTERVIEW_SCHEDULED"
  | "HIRED"
  | "WITHDRAWN";
export type MessageSender = "AGENT" | "CANDIDATE";
export type Channel = "WHATSAPP" | "EMAIL";
export type InterviewStatus = "SCHEDULED" | "RESCHEDULED" | "CANCELLED";
export type IntegrationStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";
export type LanguageProficiency = "BASIC" | "INTERMEDIATE" | "ADVANCED" | "FLUENT" | "NATIVE";

export interface ApiErrorBody {
  error: { message: string; code: string };
}

// ---- auth ----
export interface CompanyUser {
  id: string;
  role: UserRole;
  tenantId: string | null;
  name: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: CompanyUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ---- tenant ----
export interface OnboardTenantResponse {
  accessToken: string;
  refreshToken: string;
  tenant: { id: string; name: string };
  user: CompanyUser & { tenantId: string };
}

export interface ConnectWhatsAppResponse {
  status: IntegrationStatus;
  qrCode: string | null;
}

export interface WhatsAppStatusResponse {
  status: IntegrationStatus;
  connectedPhoneNumber: string | null;
}

// ---- user ----
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  phone: string | null;
}

// ---- job ----
export interface Job {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListJobsResponse {
  data: Job[];
  page: number;
  pageSize: number;
  total: number;
}

// ---- job requirement ----
export interface JobRequirement {
  id: string;
  jobId: string;
  tenantId: string;
  text: string;
  createdAt: string;
}

// ---- screening question ----
export interface ScreeningQuestion {
  id: string;
  jobId: string;
  tenantId: string;
  question: string;
  expectedAnswer: string | null;
  order: number;
  weight: number;
  createdAt: string;
}

// ---- matching ----
export interface JobMatch {
  candidateId: string;
  name: string;
  email: string | null;
  score: number;
}

// ---- application / funnel ----
export interface Application {
  id: string;
  jobId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type FunnelCounts = Record<ApplicationStatus, number>;

// ---- candidate ----
export interface Candidate {
  id: string;
  name: string;
  email: string | null;
  resumeText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateAuthResponse {
  accessToken: string;
  refreshToken: string;
  candidate: Candidate;
}

export interface ContactMethod {
  id: string;
  candidateId: string;
  channel: Channel;
  value: string;
  createdAt: string;
}

// ---- candidate resume sections ----
export interface WorkExperience {
  id: string;
  candidateId: string;
  company: string;
  role: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface Education {
  id: string;
  candidateId: string;
  institution: string;
  course: string;
  level: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface Skill {
  id: string;
  candidateId: string;
  name: string;
  createdAt: string;
}

export interface CandidateLanguage {
  id: string;
  candidateId: string;
  name: string;
  proficiency: LanguageProficiency;
  createdAt: string;
}

export interface CandidateResume {
  workExperiences: WorkExperience[];
  educations: Education[];
  skills: Skill[];
  languages: CandidateLanguage[];
}

// ---- interview ----
export interface Interview {
  id: string;
  applicationId: string;
  status: InterviewStatus;
  scheduledAt: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
