import { prisma } from "../../lib/prisma.js";
import { generateEmbedding } from "../../lib/embeddings.js";
import { setCandidateEmbedding } from "../../lib/vector.js";
import type {
  CreateWorkExperienceBody,
  CreateEducationBody,
  CreateSkillBody,
  CreateLanguageBody,
} from "./candidate-resume.schema.js";

function workExperienceNotFoundError() {
  return Object.assign(new Error("Work experience not found"), {
    statusCode: 404,
    code: "WORK_EXPERIENCE_NOT_FOUND",
  });
}

function educationNotFoundError() {
  return Object.assign(new Error("Education not found"), {
    statusCode: 404,
    code: "EDUCATION_NOT_FOUND",
  });
}

function skillNotFoundError() {
  return Object.assign(new Error("Skill not found"), { statusCode: 404, code: "SKILL_NOT_FOUND" });
}

function languageNotFoundError() {
  return Object.assign(new Error("Language not found"), {
    statusCode: 404,
    code: "LANGUAGE_NOT_FOUND",
  });
}

function formatPeriod(startDate: Date, endDate: Date | null, isCurrent: boolean): string {
  const start = startDate.toISOString().slice(0, 7);
  const end = isCurrent ? "atual" : (endDate?.toISOString().slice(0, 7) ?? "");
  return end ? `${start} a ${end}` : start;
}

export async function regenerateCandidateResumeText(candidateId: string): Promise<void> {
  const [workExperiences, educations, skills, languages] = await Promise.all([
    prisma.workExperience.findMany({ where: { candidateId }, orderBy: { startDate: "desc" } }),
    prisma.education.findMany({ where: { candidateId }, orderBy: { startDate: "desc" } }),
    prisma.skill.findMany({ where: { candidateId }, orderBy: { createdAt: "asc" } }),
    prisma.candidateLanguage.findMany({ where: { candidateId }, orderBy: { createdAt: "asc" } }),
  ]);

  const sections: string[] = [];

  if (workExperiences.length > 0) {
    const lines = workExperiences.map((experience) => {
      const period = formatPeriod(experience.startDate, experience.endDate, experience.isCurrent);
      const description = experience.description ? ` — ${experience.description}` : "";
      return `- ${experience.role} na ${experience.company} (${period})${description}`;
    });
    sections.push(`Experiência:\n${lines.join("\n")}`);
  }

  if (educations.length > 0) {
    const lines = educations.map((education) => {
      const period = formatPeriod(education.startDate, education.endDate, education.isCurrent);
      return `- ${education.level} em ${education.course}, ${education.institution} (${period})`;
    });
    sections.push(`Formação:\n${lines.join("\n")}`);
  }

  if (skills.length > 0) {
    sections.push(`Habilidades: ${skills.map((skill) => skill.name).join(", ")}`);
  }

  if (languages.length > 0) {
    const lines = languages.map((language) => `${language.name} (${language.proficiency})`);
    sections.push(`Idiomas: ${lines.join(", ")}`);
  }

  const resumeText = sections.join("\n\n") || null;

  await prisma.candidate.update({ where: { id: candidateId }, data: { resumeText } });

  if (resumeText) {
    const embedding = await generateEmbedding(resumeText);
    await setCandidateEmbedding(candidateId, embedding);
  }
}

export async function createWorkExperience(candidateId: string, data: CreateWorkExperienceBody) {
  const workExperience = await prisma.workExperience.create({ data: { candidateId, ...data } });
  await regenerateCandidateResumeText(candidateId);
  return workExperience;
}

export async function listWorkExperiences(candidateId: string) {
  return prisma.workExperience.findMany({ where: { candidateId }, orderBy: { startDate: "desc" } });
}

export async function deleteWorkExperience(candidateId: string, workExperienceId: string) {
  const workExperience = await prisma.workExperience.findFirst({
    where: { id: workExperienceId, candidateId },
  });
  if (!workExperience) throw workExperienceNotFoundError();
  await prisma.workExperience.delete({ where: { id: workExperienceId } });
  await regenerateCandidateResumeText(candidateId);
}

export async function createEducation(candidateId: string, data: CreateEducationBody) {
  const education = await prisma.education.create({ data: { candidateId, ...data } });
  await regenerateCandidateResumeText(candidateId);
  return education;
}

export async function listEducations(candidateId: string) {
  return prisma.education.findMany({ where: { candidateId }, orderBy: { startDate: "desc" } });
}

export async function deleteEducation(candidateId: string, educationId: string) {
  const education = await prisma.education.findFirst({ where: { id: educationId, candidateId } });
  if (!education) throw educationNotFoundError();
  await prisma.education.delete({ where: { id: educationId } });
  await regenerateCandidateResumeText(candidateId);
}

export async function createSkill(candidateId: string, data: CreateSkillBody) {
  const skill = await prisma.skill.create({ data: { candidateId, ...data } });
  await regenerateCandidateResumeText(candidateId);
  return skill;
}

export async function listSkills(candidateId: string) {
  return prisma.skill.findMany({ where: { candidateId }, orderBy: { createdAt: "asc" } });
}

export async function deleteSkill(candidateId: string, skillId: string) {
  const skill = await prisma.skill.findFirst({ where: { id: skillId, candidateId } });
  if (!skill) throw skillNotFoundError();
  await prisma.skill.delete({ where: { id: skillId } });
  await regenerateCandidateResumeText(candidateId);
}

export async function createLanguage(candidateId: string, data: CreateLanguageBody) {
  const language = await prisma.candidateLanguage.create({ data: { candidateId, ...data } });
  await regenerateCandidateResumeText(candidateId);
  return language;
}

export async function listLanguages(candidateId: string) {
  return prisma.candidateLanguage.findMany({
    where: { candidateId },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteLanguage(candidateId: string, languageId: string) {
  const language = await prisma.candidateLanguage.findFirst({
    where: { id: languageId, candidateId },
  });
  if (!language) throw languageNotFoundError();
  await prisma.candidateLanguage.delete({ where: { id: languageId } });
  await regenerateCandidateResumeText(candidateId);
}

export async function getCandidateResume(candidateId: string) {
  const [workExperiences, educations, skills, languages] = await Promise.all([
    listWorkExperiences(candidateId),
    listEducations(candidateId),
    listSkills(candidateId),
    listLanguages(candidateId),
  ]);
  return { workExperiences, educations, skills, languages };
}
