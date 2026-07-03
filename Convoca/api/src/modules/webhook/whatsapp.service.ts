import { prisma } from "../../lib/prisma.js";
import { processCandidateMessage } from "../application/application.service.js";
import type { WhatsappWebhookBody } from "./whatsapp.schema.js";

function extractPhoneNumber(payload: WhatsappWebhookBody): string | null {
  const remoteJid = payload.data?.key?.remoteJid;
  if (!remoteJid) return null;
  return remoteJid.split("@")[0] ?? null;
}

function extractMessageText(payload: WhatsappWebhookBody): string | null {
  return payload.data?.message?.conversation ?? null;
}

export async function handleInboundWhatsAppMessage(
  tenantId: string,
  payload: WhatsappWebhookBody,
): Promise<void> {
  if (payload.data?.key?.fromMe) return;

  const phoneNumber = extractPhoneNumber(payload);
  const content = extractMessageText(payload);
  if (!phoneNumber || !content) return;

  const contactMethod = await prisma.contactMethod.findFirst({
    where: { channel: "WHATSAPP", value: phoneNumber },
    include: { candidate: true },
  });
  if (!contactMethod) return;

  const applications = await prisma.application.findMany({
    where: {
      candidateId: contactMethod.candidateId,
      status: "IN_SCREENING",
      job: { tenantId },
    },
  });

  if (applications.length !== 1) return;

  await processCandidateMessage(tenantId, applications[0].id, content, "WHATSAPP");
}
