import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUniqueMock, createMock, sendEmailMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn().mockResolvedValue({}),
  sendEmailMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./prisma.js", () => ({
  prisma: {
    application: { findUnique: findUniqueMock },
    conversation: { create: createMock },
  },
}));

vi.mock("./notification.js", () => ({
  sendEmail: sendEmailMock,
}));

vi.mock("../config/index.js", () => ({
  config: {
    EVOLUTION_API_URL: "https://evolution.test",
    EVOLUTION_API_KEY: "test-key",
    EVOLUTION_INSTANCE_NAME: "test-instance",
  },
}));

import { evolutionWhatsAppChannel, combinedContactChannel } from "./contact-channel.js";

const applicationId = "11111111-1111-1111-1111-111111111111";

function mockContactMethods(methods: { channel: "WHATSAPP" | "EMAIL"; value: string }[]) {
  findUniqueMock.mockResolvedValue({ candidate: { contactMethods: methods } });
}

beforeEach(() => {
  findUniqueMock.mockReset();
  createMock.mockClear();
  sendEmailMock.mockClear();
  vi.unstubAllGlobals();
});

describe("evolutionWhatsAppChannel", () => {
  it("throws when the candidate has no WhatsApp contact method", async () => {
    mockContactMethods([]);

    await expect(
      evolutionWhatsAppChannel.send(applicationId, "WHATSAPP", "hello"),
    ).rejects.toMatchObject({ code: "NO_WHATSAPP_CONTACT" });
  });

  it("logs a Conversation on a successful send", async () => {
    mockContactMethods([{ channel: "WHATSAPP", value: "5511999999999" }]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    await evolutionWhatsAppChannel.send(applicationId, "WHATSAPP", "hello");

    const call = createMock.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
    expect(call?.data).toMatchObject({ applicationId, channel: "WHATSAPP", content: "hello" });
  });

  it("throws when the Evolution API responds with a non-2xx status", async () => {
    mockContactMethods([{ channel: "WHATSAPP", value: "5511999999999" }]);
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
