import { prisma } from "../../lib/prisma.js";
import { config } from "../../config/index.js";

function notFoundError() {
  return Object.assign(new Error("Tenant integration not found"), {
    statusCode: 404,
    code: "TENANT_NOT_FOUND",
  });
}

function evolutionNotConfiguredError() {
  return Object.assign(new Error("Evolution API not configured"), {
    statusCode: 503,
    code: "WHATSAPP_NOT_CONFIGURED",
  });
}

function instanceNameFor(tenantId: string) {
  return `convoca_${tenantId}`;
}

export function maskPhoneNumber(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return phone;

  const last4 = digits.slice(-4);
  const ddi = digits.slice(0, digits.length - 11 > 0 ? digits.length - 11 : 0) || "55";
  const rest = digits.slice(ddi.length, -4);
  const ddd = rest.slice(0, 2);
  const firstDigit = rest.slice(2, 3);

  return `+${ddi} ${ddd} ${firstDigit}****-${last4}`;
}

async function evolutionRequest(path: string, init?: RequestInit) {
  if (!config.EVOLUTION_API_URL || !config.EVOLUTION_API_KEY) {
    throw evolutionNotConfiguredError();
  }

  return fetch(`${config.EVOLUTION_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", apikey: config.EVOLUTION_API_KEY, ...init?.headers },
  });
}

async function registerWebhook(instanceName: string, tenantId: string) {
  await evolutionRequest(`/webhook/set/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: `${config.PUBLIC_BASE_URL}/webhooks/whatsapp/${tenantId}`,
        events: ["CONNECTION_UPDATE", "MESSAGES_UPSERT"],
      },
    }),
  });
}

export async function connectWhatsApp(tenantId: string) {
  const existing = await prisma.tenantIntegration.findUnique({ where: { tenantId } });

  let qrCode: string | null = null;

  if (!existing) {
    const instanceName = instanceNameFor(tenantId);
    const response = await evolutionRequest("/instance/create", {
      method: "POST",
      body: JSON.stringify({ instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
    });
    if (!response.ok) {
      throw Object.assign(new Error(`Evolution API responded with HTTP ${response.status}`), {
        statusCode: 502,
        code: "WHATSAPP_CONNECT_FAILED",
      });
    }
    const body = (await response.json()) as {
      hash?: string;
      qrcode?: { base64?: string; code?: string };
    };

    await prisma.tenantIntegration.create({
      data: {
        tenantId,
        evolutionInstanceName: instanceName,
        evolutionApiKey: body.hash ?? null,
        status: "CONNECTING",
      },
    });
    qrCode = body.qrcode?.base64 ?? body.qrcode?.code ?? null;
  } else {
    const response = await evolutionRequest(`/instance/connect/${existing.evolutionInstanceName}`, {
      method: "GET",
    });
    if (!response.ok) {
      throw Object.assign(new Error(`Evolution API responded with HTTP ${response.status}`), {
        statusCode: 502,
        code: "WHATSAPP_CONNECT_FAILED",
      });
    }
    const body = (await response.json()) as { base64?: string; code?: string };

    await prisma.tenantIntegration.update({
      where: { tenantId },
      data: { status: "CONNECTING", lastErrorMessage: null },
    });
    qrCode = body.base64 ?? body.code ?? null;
  }

  const integration = await prisma.tenantIntegration.findUniqueOrThrow({ where: { tenantId } });
  await registerWebhook(integration.evolutionInstanceName, tenantId);

  return { status: integration.status, qrCode };
}

export async function getWhatsAppStatus(tenantId: string) {
  const integration = await prisma.tenantIntegration.findUnique({ where: { tenantId } });
  if (!integration) {
    return { status: "DISCONNECTED" as const, connectedPhoneNumber: null };
  }

  return {
    status: integration.status,
    connectedPhoneNumber: maskPhoneNumber(integration.connectedPhoneNumber),
  };
}

export async function disconnectWhatsApp(tenantId: string) {
  const integration = await prisma.tenantIntegration.findUnique({ where: { tenantId } });
  if (!integration) throw notFoundError();

  try {
    await evolutionRequest(`/instance/logout/${integration.evolutionInstanceName}`, {
      method: "DELETE",
    });
  } catch {
    // Disconnect intent must succeed locally even if the remote call is flaky —
    // the user's expectation is that the integration stops being usable regardless.
  }

  const updated = await prisma.tenantIntegration.update({
    where: { tenantId },
    data: { status: "DISCONNECTED", connectedPhoneNumber: null },
  });

  return { status: updated.status };
}

export async function assertTenantMatch(paramsId: string, tenantId: string | null) {
  if (!tenantId || paramsId !== tenantId) {
    throw notFoundError();
  }
}
