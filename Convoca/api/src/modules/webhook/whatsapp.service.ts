import { prisma } from "../../lib/prisma.js";
import { processCandidateMessage } from "../application/application.service.js";
import type { WhatsappWebhookBody } from "./whatsapp.schema.js";

const CONNECTION_UPDATE_EVENTS = new Set(["connection.update", "CONNECTION_UPDATE"]);
const CONNECTED_STATES = new Set(["open", "CONNECTED"]);
const FAILED_STATES = new Set(["close", "DISCONNECTED"]);

function extractPhoneNumber(payload: WhatsappWebhookBody): string | null {
  const remoteJid = payload.data?.key?.remoteJid;
  if (!remoteJid) return null;
  return remoteJid.split("@")[0] ?? null;
}

function extractMessageText(payload: WhatsappWebhookBody): string | null {
  return payload.data?.message?.conversation ?? null;
}

async function handleConnectionUpdate(tenantId: string, payload: WhatsappWebhookBody): Promise<void> {
  const integration = await prisma.tenantIntegration.findUnique({ where: { tenantId } });
  if (!integration) return;

  const instanceName = payload.instance ?? payload.data?.instance;
  if (instanceName && instanceName !== integration.evolutionInstanceName) return;

  const state = payload.data?.state;
  if (state && CONNECTED_STATES.has(state)) {
    const connectedPhoneNumber = payload.data?.wuid?.split("@")[0] ?? null;
    await prisma.tenantIntegration.update({
      where: { tenantId },
      data: { status: "CONNECTED", connectedPhoneNumber, lastConnectedAt: new Date() },
    });
  } else if (state && FAILED_STATES.has(state)) {
    await prisma.tenantIntegration.update({
      where: { tenantId },
      data: { status: "ERROR", lastErrorMessage: `Connection state: ${state}` },
    });
  }
}

export async function handleInboundWhatsAppMessage(
  tenantId: string,
  payload: WhatsappWebhookBody,
): Promise<void> {
  if (payload.event && CONNECTION_UPDATE_EVENTS.has(payload.event)) {
    await handleConnectionUpdate(tenantId, payload);
    return;
  }

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
