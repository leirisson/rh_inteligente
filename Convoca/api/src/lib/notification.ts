import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config/index.js";
import { prisma } from "./prisma.js";

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const client = getTransporter();
  if (!client) {
    throw Object.assign(new Error("SMTP not configured"), {
      statusCode: 503,
      code: "EMAIL_NOT_CONFIGURED",
    });
  }

  await client.sendMail({ from: config.SMTP_FROM, to, subject, text: body });
}

export async function notifyRecruitersOnApproval(applicationId: string): Promise<void> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: true,
      job: { include: { tenant: true } },
    },
  });
  if (!application) return;

  const recipients = await prisma.user.findMany({
    where: { tenantId: application.job.tenantId, role: { in: ["TENANT_ADMIN", "RECRUITER"] } },
    select: { email: true },
  });

  const subject = `Candidato aprovado — ${application.job.title}`;
  const body = `${application.candidate.name} foi aprovado(a) na triagem para a vaga "${application.job.title}".`;

  await Promise.all(recipients.map((recipient) => sendEmail(recipient.email, subject, body)));
}
