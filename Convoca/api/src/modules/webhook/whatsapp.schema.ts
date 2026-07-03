import { z } from "zod";

export const whatsappWebhookParamsSchema = z.object({
  tenantId: z.string().uuid(),
});

export const whatsappWebhookBodySchema = z
  .object({
    data: z
      .object({
        key: z
          .object({
            remoteJid: z.string().optional(),
            fromMe: z.boolean().optional(),
          })
          .partial()
          .optional(),
        message: z
          .object({
            conversation: z.string().optional(),
          })
          .partial()
          .optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

export const whatsappWebhookResponseSchema = z.object({
  received: z.boolean(),
});

export type WhatsappWebhookBody = z.infer<typeof whatsappWebhookBodySchema>;
