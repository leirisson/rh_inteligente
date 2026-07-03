import { z } from "zod";
import { IntegrationStatus } from "@prisma/client";

export const tenantIntegrationParamsSchema = z.object({
  id: z.string().uuid(),
});

export const connectWhatsAppResponseSchema = z.object({
  status: z.nativeEnum(IntegrationStatus),
  qrCode: z.string().nullable(),
});

export const whatsAppStatusResponseSchema = z.object({
  status: z.nativeEnum(IntegrationStatus),
  connectedPhoneNumber: z.string().nullable(),
});

export const disconnectWhatsAppResponseSchema = z.object({
  status: z.nativeEnum(IntegrationStatus),
});
