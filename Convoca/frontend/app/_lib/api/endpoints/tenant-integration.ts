import "server-only";
import { companyFetch } from "@/app/_lib/api/authed-fetch";
import type {
  ConnectWhatsAppResponse,
  WhatsAppStatusResponse,
  IntegrationStatus,
} from "@/app/_lib/api/types";

export function connectWhatsApp(tenantId: string) {
  return companyFetch<ConnectWhatsAppResponse>(
    `/tenants/${tenantId}/integrations/whatsapp/connect`,
    { method: "POST" },
  );
}

export function getWhatsAppStatus(tenantId: string) {
  return companyFetch<WhatsAppStatusResponse>(
    `/tenants/${tenantId}/integrations/whatsapp/status`,
  );
}

export function disconnectWhatsApp(tenantId: string) {
  return companyFetch<{ status: IntegrationStatus }>(
    `/tenants/${tenantId}/integrations/whatsapp/disconnect`,
    { method: "POST" },
  );
}
