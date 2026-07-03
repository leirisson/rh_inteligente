import "server-only";
import { candidateFetch } from "@/app/_lib/api/authed-fetch";
import type { Candidate, ContactMethod, Application, Channel } from "@/app/_lib/api/types";

export function getMe() {
  return candidateFetch<Candidate>("/candidates/me");
}

export function updateMe(input: { name?: string; resumeText?: string }) {
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
