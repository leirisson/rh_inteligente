import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUniqueMock, integrationFindUniqueMock, createMock, sendEmailMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  integrationFindUniqueMock: vi.fn(),
  createMock: vi.fn().mockResolvedValue({}),
  sendEmailMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./prisma.js", () => ({
  prisma: {
    application: { findUnique: findUniqueMock },
    tenantIntegration: { findUnique: integrationFindUniqueMock },
    conversation: { create: createMock },
  },
}));

vi.mock("./notification.js", () => ({
  sendEmail: sendEmailMock,
}));

vi.mock("../config/index.js", () => ({
  config: {
    EVOLUTION_API_URL: "https://evolution.test",
  },
}));

import { evolutionWhatsAppChannel, combinedContactChannel } from "./contact-channel.js";

const applicationId = "11111111-1111-1111-1111-111111111111";
const tenantId = "22222222-2222-2222-2222-222222222222";

function mockContactMethods(methods: { channel: "WHATSAPP" | "EMAIL"; value: string }[]) {
  findUniqueMock.mockResolvedValue({ candidate: { contactMethods: methods } });
}

function mockJobTenant() {
  findUniqueMock.mockResolvedValue({ job: { tenantId } });
}

function mockConnectedIntegration(overrides: Partial<Record<string, unknown>> = {}) {
  integrationFindUniqueMock.mockResolvedValue({
    tenantId,
    evolutionInstanceName: "convoca_" + tenantId,
    evolutionApiKey: "test-instance-token",
    status: "CONNECTED",
    ...overrides,
  });
}

beforeEach(() => {
  findUniqueMock.mockReset();
  integrationFindUniqueMock.mockReset();
  createMock.mockClear();
  sendEmailMock.mockClear();
  vi.unstubAllGlobals();
});

describe("evolutionWhatsAppChannel", () => {
  it("throws when the candidate has no WhatsApp contact method", async () => {
    findUniqueMock.mockResolvedValue({ candidate: { contactMethods: [] } });

    await expect(
      evolutionWhatsAppChannel.send(applicationId, "WHATSAPP", "hello"),
    ).rejects.toMatchObject({ code: "NO_WHATSAPP_CONTACT" });
  });

  it("throws WHATSAPP_NOT_CONFIGURED when the tenant has no connected integration", async () => {
    findUniqueMock
      .mockResolvedValueOnce({ candidate: { contactMethods: [{ channel: "WHATSAPP", value: "5511999999999" }] } })
      .mockResolvedValueOnce({ job: { tenantId } });
    integrationFindUniqueMock.mockResolvedValue(null);

    await expect(
      evolutionWhatsAppChannel.send(applicationId, "WHATSAPP", "hello"),
    ).rejects.toMatchObject({ code: "WHATSAPP_NOT_CONFIGURED", statusCode: 503 });
  });

  it("throws WHATSAPP_NOT_CONFIGURED when the tenant integration is not CONNECTED", async () => {
    findUniqueMock
      .mockResolvedValueOnce({ candidate: { contactMethods: [{ channel: "WHATSAPP", value: "5511999999999" }] } })
      .mockResolvedValueOnce({ job: { tenantId } });
    integrationFindUniqueMock.mockResolvedValue({
      tenantId,
      evolutionInstanceName: "convoca_" + tenantId,
      evolutionApiKey: "test-instance-token",
      status: "CONNECTING",
    });

    await expect(
      evolutionWhatsAppChannel.send(applicationId, "WHATSAPP", "hello"),
    ).rejects.toMatchObject({ code: "WHATSAPP_NOT_CONFIGURED", statusCode: 503 });
  });

  it("sends via the tenant's own instance/token and logs a Conversation on success", async () => {
    findUniqueMock
      .mockResolvedValueOnce({ candidate: { contactMethods: [{ channel: "WHATSAPP", value: "5511999999999" }] } })
      .mockResolvedValueOnce({ job: { tenantId } });
    mockConnectedIntegration();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await evolutionWhatsAppChannel.send(applicationId, "WHATSAPP", "hello");

    expect(fetchMock).toHaveBeenCalledWith(
      `https://evolution.test/message/sendText/convoca_${tenantId}`,
      expect.objectContaining({
        headers: expect.objectContaining({ apikey: "test-instance-token" }),
      }),
    );
    const call = createMock.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
    expect(call?.data).toMatchObject({ applicationId, channel: "WHATSAPP", content: "hello" });
  });

  it("throws when the Evolution API responds with a non-2xx status", async () => {
    findUniqueMock
      .mockResolvedValueOnce({ candidate: { contactMethods: [{ channel: "WHATSAPP", value: "5511999999999" }] } })
      .mockResolvedValueOnce({ job: { tenantId } });
    mockConnectedIntegration();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(
      evolutionWhatsAppChannel.send(applicationId, "WHATSAPP", "hello"),
    ).rejects.toThrow();
  });
});

describe("combinedContactChannel", () => {
  it("falls back to email when the WhatsApp send fails", async () => {
    findUniqueMock
      .mockResolvedValueOnce({ candidate: { contactMethods: [] } }) // WhatsApp lookup: none
      .mockResolvedValueOnce({
        candidate: { contactMethods: [{ channel: "EMAIL", value: "candidate@test.com" }] },
      });

    await combinedContactChannel.send(applicationId, "WHATSAPP", "hello");

    expect(sendEmailMock).toHaveBeenCalledWith(
      "candidate@test.com",
      "Convoca — Nova mensagem",
      "hello",
    );
    const call = createMock.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
    expect(call?.data).toMatchObject({ channel: "EMAIL" });
  });

  it("uses email directly when EMAIL is requested", async () => {
    mockContactMethods([{ channel: "EMAIL", value: "candidate@test.com" }]);

    await combinedContactChannel.send(applicationId, "EMAIL", "hi");

    expect(sendEmailMock).toHaveBeenCalled();
  });
});
