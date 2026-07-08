import {
  PrismaClient,
  UserRole,
  JobStatus,
  Channel,
  ApplicationStatus,
  LanguageProficiency,
} from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dev data...");

  // Tenant
  const tenant = await prisma.tenant.create({
    data: { name: "Empresa Demo Ltda." },
  });

  // Users
  const superAdminHash = await argon2.hash("SuperAdmin@1234");
  const adminHash = await argon2.hash("Admin@1234");
  const recruiterHash = await argon2.hash("Recruiter@1234");

  await prisma.user.createMany({
    data: [
      {
        tenantId: tenant.id,
        email: "superadmin@convoca.com",
        passwordHash: superAdminHash,
        role: UserRole.SUPER_ADMIN,
        name: "Super Admin",
      },
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
  const candidateHash = await argon2.hash("Candidate@1234");
  const candidate = await prisma.candidate.create({
    data: {
      name: "João Silva",
      email: "joao.silva@email.com",
      passwordHash: candidateHash,
      contactMethods: {
        create: [
          { channel: Channel.EMAIL, value: "joao.silva@email.com" },
          { channel: Channel.WHATSAPP, value: "+5511999999999" },
        ],
      },
      workExperiences: {
        create: [
          {
            company: "Tech Solutions Ltda.",
            role: "Desenvolvedor Backend Pleno",
            description: "APIs REST em Node.js/TypeScript, integrações de pagamento, PostgreSQL.",
            startDate: new Date("2022-03-01"),
            isCurrent: true,
          },
          {
            company: "StartupXP",
            role: "Desenvolvedor Backend Júnior",
            description: "Manutenção de serviços Node.js e integração com filas.",
            startDate: new Date("2020-01-01"),
            endDate: new Date("2022-02-01"),
            isCurrent: false,
          },
        ],
      },
      educations: {
        create: [
          {
            institution: "Universidade Federal Demo",
            course: "Ciência da Computação",
            level: "Graduação",
            startDate: new Date("2016-02-01"),
            endDate: new Date("2019-12-01"),
            isCurrent: false,
          },
        ],
      },
      skills: {
        create: [
          { name: "Node.js" },
          { name: "TypeScript" },
          { name: "PostgreSQL" },
          { name: "Docker" },
        ],
      },
      languages: {
        create: [
          { name: "Português", proficiency: LanguageProficiency.NATIVE },
          { name: "Inglês", proficiency: LanguageProficiency.ADVANCED },
        ],
      },
    },
  });

  // resumeText/embedding do candidato são derivados das seções estruturadas acima —
  // mesmo texto que regenerateCandidateResumeText (candidate-resume.service.ts) geraria.
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      resumeText:
        "Experiência:\n" +
        "- Desenvolvedor Backend Pleno na Tech Solutions Ltda. (2022-03 a atual) — APIs REST em Node.js/TypeScript, integrações de pagamento, PostgreSQL.\n" +
        "- Desenvolvedor Backend Júnior na StartupXP (2020-01 a 2022-02) — Manutenção de serviços Node.js e integração com filas.\n\n" +
        "Formação:\n" +
        "- Graduação em Ciência da Computação, Universidade Federal Demo (2016-02 a 2019-12)\n\n" +
        "Habilidades: Node.js, TypeScript, PostgreSQL, Docker\n\n" +
        "Idiomas: Português (NATIVE), Inglês (ADVANCED)",
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
  console.log(`  Users: superadmin@convoca.com / admin@demo.com / recruiter@demo.com`);
  console.log(`  Jobs: 1 ACTIVE + 1 DRAFT`);
  console.log(`  Candidate: ${candidate.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
