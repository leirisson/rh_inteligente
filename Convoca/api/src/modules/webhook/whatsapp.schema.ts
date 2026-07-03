import { z } from "zod";

export const whatsappWebhookParamsSchema = z.object({
  tenantId: z.string().uuid(),
});

export const whatsappWebhookBodySchema = z
  .object({
    event: z.string().optional(),
    instance: z.string().optional(),
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
        state: z.string().optional(),
        instance: z.string().optional(),
        wuid: z.string().optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

export const whatsappWebhookResponseSchema = z.object({
  received: z.boolean(),
});

export type WhatsappWebhookBody = z.infer<typeof whatsappWebhookBodySchema>;
