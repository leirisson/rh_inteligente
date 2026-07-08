import "server-only";
import { candidateFetch } from "@/app/_lib/api/authed-fetch";
import type {
  Candidate,
  ContactMethod,
  Application,
  Channel,
  WorkExperience,
  Education,
  Skill,
  CandidateLanguage,
  CandidateResume,
  LanguageProficiency,
} from "@/app/_lib/api/types";

export function getMe() {
  return candidateFetch<Candidate>("/candidates/me");
}

export function updateMe(input: { name?: string }) {
  return candidateFetch<Candidate>("/candidates/me", { method: "PATCH", body: input });
}

export function listContactMethods() {
  return candidateFetch<ContactMethod[]>("/candidates/me/contact-methods");
}

export function createContactMethod(channel: Channel, value: string) {
  return candidateFetch<ContactMethod>("/candidates/me/contact-methods", {
    method: "POST",
    body: { channel, value },
  });
}

export function deleteContactMethod(contactMethodId: string) {
  return candidateFetch<void>(`/candidates/me/contact-methods/${contactMethodId}`, {
    method: "DELETE",
  });
}

export function listMyApplications() {
  return candidateFetch<Application[]>("/candidates/me/applications");
}

export function getMyResume() {
  return candidateFetch<CandidateResume>("/candidates/me/resume");
}

export function createWorkExperience(input: {
  company: string;
  role: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}) {
  return candidateFetch<WorkExperience>("/candidates/me/work-experiences", {
    method: "POST",
    body: input,
  });
}

export function deleteWorkExperience(workExperienceId: string) {
  return candidateFetch<void>(`/candidates/me/work-experiences/${workExperienceId}`, {
    method: "DELETE",
  });
}

export function createEducation(input: {
  institution: string;
  course: string;
  level: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}) {
  return candidateFetch<Education>("/candidates/me/educations", { method: "POST", body: input });
}

export function deleteEducation(educationId: string) {
  return candidateFetch<void>(`/candidates/me/educations/${educationId}`, { method: "DELETE" });
}

export function createSkill(name: string) {
  return candidateFetch<Skill>("/candidates/me/skills", { method: "POST", body: { name } });
}

export function deleteSkill(skillId: string) {
  return candidateFetch<void>(`/candidates/me/skills/${skillId}`, { method: "DELETE" });
}

export function createLanguage(name: string, proficiency: LanguageProficiency) {
  return candidateFetch<CandidateLanguage>("/candidates/me/languages", {
    method: "POST",
    body: { name, proficiency },
  });
}

export function deleteLanguage(languageId: string) {
  return candidateFetch<void>(`/candidates/me/languages/${languageId}`, { method: "DELETE" });
}
