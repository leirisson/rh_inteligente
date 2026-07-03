import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../../config/index.js";
import {
  whatsappWebhookParamsSchema,
  whatsappWebhookBodySchema,
  whatsappWebhookResponseSchema,
} from "./whatsapp.schema.js";
import type { WhatsappWebhookBody } from "./whatsapp.schema.js";
import { handleInboundWhatsAppMessage } from "./whatsapp.service.js";

async function verifyWebhookSecret(request: FastifyRequest, reply: FastifyReply) {
  const secret = request.headers["x-webhook-secret"];
  if (!config.EVOLUTION_WEBHOOK_SECRET || secret !== config.EVOLUTION_WEBHOOK_SECRET) {
    await reply.status(401).send({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
  }
}

export function whatsappWebhookRoutes(app: FastifyInstance): void {
  app.post(
    "/:tenantId",
    {
      preHandler: verifyWebhookSecret,
      schema: {
        params: whatsappWebhookParamsSchema,
        body: whatsappWebhookBodySchema,
        response: { 200: whatsappWebhookResponseSchema },
      },
    },
    async (request) => {
      const { tenantId } = request.params as { tenantId: string };
      const body = request.body as WhatsappWebhookBody;
      await handleInboundWhatsAppMessage(tenantId, body);
      return { received: true };
    },
  );
}
