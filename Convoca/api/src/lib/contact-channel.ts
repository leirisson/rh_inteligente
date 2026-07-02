import type { Channel } from "@prisma/client";
import { prisma } from "./prisma.js";

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
