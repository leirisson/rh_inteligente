import { prisma } from "../../lib/prisma.js";
import type { UpdateUserBody } from "./user.schema.js";

function notFoundError() {
  return Object.assign(new Error("User not found"), { statusCode: 404, code: "USER_NOT_FOUND" });
}

export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFoundError();
  return user;
}

export async function updateUser(userId: string, data: UpdateUserBody) {
  await getUser(userId);
  return prisma.user.update({ where: { id: userId }, data });
}
