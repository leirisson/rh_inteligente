import type { Channel } from "@prisma/client";
import { prisma } from "./prisma.js";
import { config } from "../config/index.js";
import { sendEmail } from "./notification.js";

export interface ContactChannel {
  send(applicationId: string, channel: Channel, content: string): Promise<void>;
}

export const mockContactChannel: ContactChannel = {
  async send(applicationId, channel, content) {
    await prisma.conversation.create({
      data: { applicationId, sender: "AGENT", channel, content, sentAt: new Date() },
    });
  },
};

export async function getPreferredContactMethod(applicationId: string, channel: Channel) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: { include: { contactMethods: true } } },
  });
  if (!application) return null;

  return application.candidate.contactMethods.find((method) => method.channel === channel) ?? null;
}

async function logConversation(applicationId: string, channel: Channel, content: string) {
  await prisma.conversation.create({
    data: { applicationId, sender: "AGENT", channel, content, sentAt: new Date() },
  });
}

export const evolutionWhatsAppChannel: ContactChannel = {
  async send(applicationId, _channel, content) {
    const contact = await getPreferredContactMethod(applicationId, "WHATSAPP");
    if (!contact) {
      throw Object.assign(new Error("No WhatsApp contact method for application"), {
        statusCode: 422,
        code: "NO_WHATSAPP_CONTACT",
      });
    }
    if (!config.EVOLUTION_API_URL || !config.EVOLUTION_INSTANCE_NAME) {
      throw Object.assign(new Error("Evolution API not configured"), {
        statusCode: 503,
        code: "WHATSAPP_NOT_CONFIGURED",
      });
    }

    const response = await fetch(
      `${config.EVOLUTION_API_URL}/message/sendText/${config.EVOLUTION_INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.EVOLUTION_API_KEY ?? "",
        },
        body: JSON.stringify({ number: contact.value, text: content }),
      },
    );
    if (!response.ok) {
      throw new Error(`Evolution API responded with HTTP ${response.status}`);
    }

    await logConversation(applicationId, "WHATSAPP", content);
  },
};

export const emailChannel: ContactChannel = {
  async send(applicationId, _channel, content) {
    const contact = await getPreferredContactMethod(applicationId, "EMAIL");
    if (!contact) {
      throw Object.assign(new Error("No email contact method for application"), {
        statusCode: 422,
        code: "NO_EMAIL_CONTACT",
      });
    }

    await sendEmail(contact.value, "Convoca — Nova mensagem", content);
    await logConversation(applicationId, "EMAIL", content);
  },
};

export const combinedContactChannel: ContactChannel = {
  async send(applicationId, channel, content) {
    if (channel === "EMAIL") {
      return emailChannel.send(applicationId, "EMAIL", content);
    }
    try {
      return await evolutionWhatsAppChannel.send(applicationId, "WHATSAPP", content);
    } catch {
      return emailChannel.send(applicationId, "EMAIL", content);
    }
  },
};
