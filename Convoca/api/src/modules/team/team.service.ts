import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../auth/auth.service.js";
import type { CreateTeamMemberBody } from "./team.schema.js";

function memberNotFoundError() {
  return Object.assign(new Error("Team member not found"), {
    statusCode: 404,
    code: "TEAM_MEMBER_NOT_FOUND",
  });
}

function emailTakenError() {
  return Object.assign(new Error("Email already in use"), {
    statusCode: 409,
    code: "EMAIL_TAKEN",
  });
}

export async function listTeamMembers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId },
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createTeamMember(tenantId: string, data: CreateTeamMemberBody) {
  const passwordHash = await hashPassword(data.password);

  try {
    return await prisma.user.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw emailTakenError();
    }
    throw error;
  }
}

export async function updateTeamMemberRole(tenantId: string, userId: string, role: UserRole) {
  const member = await prisma.user.findUnique({ where: { id: userId } });
  if (!member || member.tenantId !== tenantId) throw memberNotFoundError();

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
  });
}
