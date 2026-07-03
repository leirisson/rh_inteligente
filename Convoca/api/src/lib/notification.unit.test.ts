import { describe, it, expect, vi, afterEach } from "vitest";

const { sendMailMock, createTransportMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn().mockResolvedValue({}),
  createTransportMock: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

createTransportMock.mockReturnValue({ sendMail: sendMailMock });

afterEach(() => {
  vi.resetModules();
  sendMailMock.mockClear();
  createTransportMock.mockClear();
});

describe("sendEmail", () => {
  it("throws EMAIL_NOT_CONFIGURED when SMTP env vars are unset", async () => {
    vi.doMock("../config/index.js", () => ({
      config: { SMTP_HOST: undefined, SMTP_USER: undefined, SMTP_PASSWORD: undefined },
    }));
    const { sendEmail } = await import("./notification.js");

    await expect(sendEmail("to@test.com", "Subject", "Body")).rejects.toMatchObject({
      statusCode: 503,
      code: "EMAIL_NOT_CONFIGURED",
    });
  });

  it("sends mail via the configured transport when SMTP is set", async () => {
    vi.doMock("../config/index.js", () => ({
      config: {
        SMTP_HOST: "smtp.test.local",
        SMTP_PORT: 587,
        SMTP_USER: "user",
        SMTP_PASSWORD: "pass",
        SMTP_FROM: "Convoca <no-reply@test.local>",
      },
    }));
    const { sendEmail } = await import("./notification.js");

    await sendEmail("to@test.com", "Subject", "Body");

    expect(sendMailMock).toHaveBeenCalledWith({
      from: "Convoca <no-reply@test.local>",
      to: "to@test.com",
      subject: "Subject",
      text: "Body",
    });
  });
});
