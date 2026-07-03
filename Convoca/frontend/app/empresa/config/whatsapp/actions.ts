"use server";

import { revalidatePath } from "next/cache";
import { verifyCompanySession } from "@/app/_lib/auth/session";
import { connectWhatsApp, disconnectWhatsApp } from "@/app/_lib/api/endpoints/tenant-integration";
import type { ConnectWhatsAppResponse } from "@/app/_lib/api/types";

export async function connectWhatsAppAction(): Promise<ConnectWhatsAppResponse> {
  const session = await verifyCompanySession();
  if (!session.user.tenantId) throw new Error("Sem tenant associado");
  const result = await connectWhatsApp(session.user.tenantId);
  revalidatePath("/empresa/config/whatsapp");
  return result;
}

export async function disconnectWhatsAppAction() {
  const session = await verifyCompanySession();
  if (!session.user.tenantId) throw new Error("Sem tenant associado");
  await disconnectWhatsApp(session.user.tenantId);
  revalidatePath("/empresa/config/whatsapp");
}
