"use server";

import { revalidatePath } from "next/cache";
import {
  updateMe,
  createContactMethod,
  deleteContactMethod,
  createWorkExperience,
  deleteWorkExperience,
  createEducation,
  deleteEducation,
  createSkill,
  deleteSkill,
  createLanguage,
  deleteLanguage,
} from "@/app/_lib/api/endpoints/candidates";
import type { Channel, LanguageProficiency } from "@/app/_lib/api/types";

export async function updateProfileAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await updateMe({ name });
  revalidatePath("/candidato/perfil");
}

export async function addContactMethodAction(formData: FormData) {
  const channel = formData.get("channel") as Channel;
  const value = String(formData.get("value") ?? "").trim();
  if (!value) return;

  await createContactMethod(channel, value);
  revalidatePath("/candidato/perfil");
}

export async function removeContactMethodAction(contactMethodId: string) {
  await deleteContactMethod(contactMethodId);
  revalidatePath("/candidato/perfil");
}

export async function addWorkExperienceAction(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const isCurrent = formData.get("isCurrent") === "on";
  if (!company || !role || !startDate) return;

  await createWorkExperience({
    company,
    role,
    description: description || undefined,
    startDate,
    endDate: isCurrent ? undefined : endDate || undefined,
    isCurrent,
  });
  revalidatePath("/candidato/perfil");
}

export async function removeWorkExperienceAction(workExperienceId: string) {
  await deleteWorkExperience(workExperienceId);
  revalidatePath("/candidato/perfil");
}

export async function addEducationAction(formData: FormData) {
  const institution = String(formData.get("institution") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const isCurrent = formData.get("isCurrent") === "on";
  if (!institution || !course || !level || !startDate) return;

  await createEducation({
    institution,
    course,
    level,
    startDate,
    endDate: isCurrent ? undefined : endDate || undefined,
    isCurrent,
  });
  revalidatePath("/candidato/perfil");
}

export async function removeEducationAction(educationId: string) {
  await deleteEducation(educationId);
  revalidatePath("/candidato/perfil");
}

export async function addSkillAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await createSkill(name);
  revalidatePath("/candidato/perfil");
}

export async function removeSkillAction(skillId: string) {
  await deleteSkill(skillId);
  revalidatePath("/candidato/perfil");
}

export async function addLanguageAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const proficiency = formData.get("proficiency") as LanguageProficiency;
  if (!name || !proficiency) return;

  await createLanguage(name, proficiency);
  revalidatePath("/candidato/perfil");
}

export async function removeLanguageAction(languageId: string) {
  await deleteLanguage(languageId);
  revalidatePath("/candidato/perfil");
}
