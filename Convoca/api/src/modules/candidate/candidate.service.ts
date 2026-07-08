import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, verifyPassword, buildTokens } from "../auth/auth.service.js";
import type { JWTPayload } from "../../lib/rbac.js";
import type { CandidateAuthResponse } from "./candidate.types.js";

function notFoundError() {
  return Object.assign(new Error("Candidate not found"), {
    statusCode: 404,
    code: "CANDIDATE_NOT_FOUND",
  });
}

function invalidCredentialsError() {
  return Object.assign(new Error("Invalid credentials"), {
    statusCode: 401,
    code: "INVALID_CREDENTIALS",
  });
}

function buildCandidateTokens(app: FastifyInstance, candidateId: string) {
  const payload: JWTPayload = { type: "candidate", candidate_id: candidateId };
  return buildTokens(app, payload);
}

export async function signupCandidate(
  app: FastifyInstance,
  name: string,
  email: string,
  password: string,
): Promise<CandidateAuthResponse> {
  const passwordHash = await hashPassword(password);

  let candidate;
  try {
    candidate = await prisma.candidate.create({
      data: { name, email, passwordHash },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw Object.assign(new Error("Email already in use"), {
        statusCode: 409,
        code: "EMAIL_TAKEN",
      });
    }
    throw error;
  }

  const { accessToken, refreshToken } = buildCandidateTokens(app, candidate.id);

  return { accessToken, refreshToken, candidate };
}

export async function loginCandidate(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<CandidateAuthResponse> {
  const candidate = await prisma.candidate.findUnique({ where: { email } });
  if (!candidate) throw invalidCredentialsError();

  const valid = await verifyPassword(password, candidate.passwordHash);
  if (!valid) throw invalidCredentialsError();

  const { accessToken, refreshToken } = buildCandidateTokens(app, candidate.id);

  return { accessToken, refreshToken, candidate };
}

export async function getCandidate(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw notFoundError();
  return candidate;
}

export async function updateCandidate(candidateId: string, data: { name?: string }) {
  await getCandidate(candidateId);
  return prisma.candidate.update({ where: { id: candidateId }, data });
}

export async function createContactMethod(
  candidateId: string,
  channel: "WHATSAPP" | "EMAIL",
  value: string,
) {
  await getCandidate(candidateId);
  try {
    return await prisma.contactMethod.create({ data: { candidateId, channel, value } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw Object.assign(new Error("Contact method already registered"), {
        statusCode: 409,
        code: "CONTACT_METHOD_TAKEN",
      });
    }
    throw error;
  }
}

export async function listContactMethods(candidateId: string) {
  await getCandidate(candidateId);
  return prisma.contactMethod.findMany({ where: { candidateId }, orderBy: { createdAt: "asc" } });
}

export async function deleteContactMethod(candidateId: string, contactMethodId: string) {
  await getCandidate(candidateId);
  const contactMethod = await prisma.contactMethod.findFirst({
    where: { id: contactMethodId, candidateId },
  });
  if (!contactMethod) {
    throw Object.assign(new Error("Contact method not found"), {
      statusCode: 404,
      code: "CONTACT_METHOD_NOT_FOUND",
    });
  }
  await prisma.contactMethod.delete({ where: { id: contactMethodId } });
}

export async function listCandidateApplications(candidateId: string) {
  await getCandidate(candidateId);
  return prisma.application.findMany({ where: { candidateId }, orderBy: { createdAt: "desc" } });
}
