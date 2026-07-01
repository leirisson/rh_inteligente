import { PrismaClient, UserRole, JobStatus, Channel, ApplicationStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dev data...");

  // Tenant
  const tenant = await prisma.tenant.create({
    data: { name: "Empresa Demo Ltda." },
  });

  // Users
  const adminHash = await argon2.hash("Admin@1234");
  const recruiterHash = await argon2.hash("Recruiter@1234");

  await prisma.user.createMany({
    data: [
      {
        tenantId: tenant.id,
        email: "admin@demo.com",
        passwordHash: adminHash,
        role: UserRole.TENANT_ADMIN,
        name: "Admin Demo",
      },
      {
        tenantId: tenant.id,
        email: "recruiter@demo.com",
        passwordHash: recruiterHash,
        role: UserRole.RECRUITER,
        name: "Recruiter Demo",
      },
    ],
  });

  // Jobs
  const activeJob = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      title: "Desenvolvedor(a) Backend Pleno",
      description: "Vaga para dev backend com experiência em Node.js e TypeScript.",
      status: JobStatus.ACTIVE,
    },
  });

  await prisma.job.create({
    data: {
      tenantId: tenant.id,
      title: "Designer UX/UI",
      description: "Vaga para designer com foco em produtos digitais B2B.",
      status: JobStatus.DRAFT,
    },
  });

  // Screening questions
  await prisma.screeningQuestion.createMany({
    data: [
      {
        jobId: activeJob.id,
        tenantId: tenant.id,
        question: "Quantos anos de experiência você tem com Node.js?",
        expectedAnswer: "Mínimo 3 anos",
        order: 1,
        weight: 2.0,
      },
      {
        jobId: activeJob.id,
        tenantId: tenant.id,
        question: "Você tem experiência com bancos de dados relacionais?",
        expectedAnswer: "PostgreSQL ou similar",
        order: 2,
        weight: 1.5,
      },
    ],
  });

  // Candidate
  const candidate = await prisma.candidate.create({
    data: {
      name: "João Silva",
      email: "joao.silva@email.com",
      resumeText: "Desenvolvedor backend com 4 anos de experiência em Node.js, TypeScript e PostgreSQL.",
      contactMethods: {
        create: [
          { channel: Channel.EMAIL, value: "joao.silva@email.com" },
          { channel: Channel.WHATSAPP, value: "+5511999999999" },
        ],
      },
    },
  });

  // Application
  await prisma.application.create({
    data: {
      candidateId: candidate.id,
      jobId: activeJob.id,
      status: ApplicationStatus.PENDING_CONTACT,
      stages: {
        create: { status: ApplicationStatus.PENDING_CONTACT, note: "Candidato identificado via matching" },
      },
    },
  });

  console.log("Seed completo:");
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`  Users: admin@demo.com / Recruiter: recruiter@demo.com`);
  console.log(`  Jobs: 1 ACTIVE + 1 DRAFT`);
  console.log(`  Candidate: ${candidate.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
