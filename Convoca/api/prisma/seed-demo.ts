import { PrismaClient, ApplicationStatus, Channel, MessageSender } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const CANDIDATES = [
  { name: "Ana Beatriz Costa", email: "ana.costa@demo.com", resume: "Backend pleno, 4 anos Node.js/TS, PostgreSQL, AWS." },
  { name: "Bruno Almeida", email: "bruno.almeida@demo.com", resume: "Dev backend júnior, 1 ano de experiência, JavaScript e Express." },
  { name: "Carla Menezes", email: "carla.menezes@demo.com", resume: "Backend sênior, 8 anos, Node.js, microsserviços, liderança técnica." },
  { name: "Diego Ferreira", email: "diego.ferreira@demo.com", resume: "Fullstack com foco backend, 3 anos, TypeScript, PostgreSQL, Docker." },
  { name: "Erica Souza", email: "erica.souza@demo.com", resume: "Backend pleno, 5 anos, Node.js, filas, arquitetura orientada a eventos." },
  { name: "Felipe Nogueira", email: "felipe.nogueira@demo.com", resume: "Dev backend, 2 anos, Node.js e MongoDB, aprendendo TypeScript." },
  { name: "Gabriela Rocha", email: "gabriela.rocha@demo.com", resume: "Backend pleno, 4 anos, TypeScript, testes automatizados, CI/CD." },
  { name: "Hugo Martins", email: "hugo.martins@demo.com", resume: "Backend sênior, 6 anos, Node.js, PostgreSQL, performance e escalabilidade." },
  { name: "Isabela Duarte", email: "isabela.duarte@demo.com", resume: "Dev backend pleno, 3 anos, Node.js, APIs REST, Docker." },
  { name: "João Pedro Lima", email: "joaopedro.lima@demo.com", resume: "Backend júnior, 1 ano, JavaScript, primeiros passos com TypeScript." },
  { name: "Karina Ribeiro", email: "karina.ribeiro@demo.com", resume: "Backend pleno, 4 anos, Node.js, PostgreSQL, integrações de pagamento." },
  { name: "Lucas Tavares", email: "lucas.tavares@demo.com", resume: "Backend sênior, 7 anos, arquitetura de sistemas distribuídos, Node.js." },
];

const CONVERSATION_SCRIPT = [
  { sender: MessageSender.AGENT, text: "Olá! Vi seu perfil e você tem tudo a ver com uma vaga de Backend aberta agora. Posso te fazer algumas perguntas rápidas?" },
  { sender: MessageSender.CANDIDATE, text: "Oi! Pode sim, fico à disposição." },
  { sender: MessageSender.AGENT, text: "Ótimo! Quantos anos de experiência você tem com Node.js?" },
  { sender: MessageSender.CANDIDATE, text: "Tenho 4 anos trabalhando com Node.js, principalmente em APIs REST." },
  { sender: MessageSender.AGENT, text: "Perfeito. E você tem experiência com bancos de dados relacionais, como PostgreSQL?" },
  { sender: MessageSender.CANDIDATE, text: "Sim, uso PostgreSQL no dia a dia há uns 3 anos." },
  { sender: MessageSender.AGENT, text: "Excelente! Seu perfil foi aprovado na triagem inicial. Nossa equipe vai entrar em contato para os próximos passos." },
];

async function main() {
  console.log("Seeding demo data (screenshots)...");

  const tenant = await prisma.tenant.findFirst({
    where: { name: "Empresa Demo Ltda." },
  });
  if (!tenant) {
    throw new Error("Tenant 'Empresa Demo Ltda.' não encontrado — rode o seed principal primeiro.");
  }

  const activeJob = await prisma.job.findFirst({
    where: { tenantId: tenant.id, title: "Desenvolvedor(a) Backend Pleno" },
    include: { screeningQuestions: true },
  });
  if (!activeJob) {
    throw new Error("Vaga 'Desenvolvedor(a) Backend Pleno' não encontrada — rode o seed principal primeiro.");
  }

  const passwordHash = await argon2.hash("Candidate@1234");

  // Distribuição de status pelo funil (12 candidatos)
  const statusPlan: ApplicationStatus[] = [
    ApplicationStatus.PENDING_CONTACT,
    ApplicationStatus.PENDING_CONTACT,
    ApplicationStatus.IN_SCREENING,
    ApplicationStatus.IN_SCREENING,
    ApplicationStatus.IN_SCREENING,
    ApplicationStatus.REJECTED,
    ApplicationStatus.APPROVED,
    ApplicationStatus.APPROVED,
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.HIRED,
    ApplicationStatus.APPROVED,
  ];

  for (let i = 0; i < CANDIDATES.length; i++) {
    const c = CANDIDATES[i];
    const status = statusPlan[i];

    const candidate = await prisma.candidate.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        passwordHash,
        resumeText: c.resume,
        contactMethods: {
          create: [
            { channel: Channel.WHATSAPP, value: `+55119${String(10000000 + i).padStart(8, "0")}` },
          ],
        },
      },
    });

    const existing = await prisma.application.findUnique({
      where: { candidateId_jobId: { candidateId: candidate.id, jobId: activeJob.id } },
    });
    if (existing) {
      console.log(`  Application já existe para ${c.name}, pulando.`);
      continue;
    }

    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: activeJob.id,
        status,
        stages: {
          create: buildStageHistory(status),
        },
      },
    });

    // Conversas de WhatsApp para quem passou de PENDING_CONTACT
    if (status !== ApplicationStatus.PENDING_CONTACT) {
      const baseTime = Date.now() - 1000 * 60 * 60 * 24 * (i + 1);
      const messages = status === ApplicationStatus.REJECTED
        ? CONVERSATION_SCRIPT.slice(0, 4)
        : CONVERSATION_SCRIPT;

      for (let m = 0; m < messages.length; m++) {
        await prisma.conversation.create({
          data: {
            applicationId: application.id,
            sender: messages[m].sender,
            channel: Channel.WHATSAPP,
            content: messages[m].text,
            sentAt: new Date(baseTime + m * 1000 * 60 * 3),
          },
        });
      }
    }

    // Respostas de triagem para quem passou por IN_SCREENING+
    if (
      [
        ApplicationStatus.IN_SCREENING,
        ApplicationStatus.APPROVED,
        ApplicationStatus.INTERVIEW_SCHEDULED,
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
      ].includes(status) &&
      activeJob.screeningQuestions.length > 0
    ) {
      for (const q of activeJob.screeningQuestions) {
        await prisma.screeningAnswer.create({
          data: {
            applicationId: application.id,
            questionId: q.id,
            answer: "Resposta de exemplo compatível com o esperado.",
            score: status === ApplicationStatus.REJECTED ? 0.4 : 0.9,
            verdict: status === ApplicationStatus.REJECTED ? "insufficient" : "match",
          },
        });
      }
    }

    // Entrevistas agendadas
    if (status === ApplicationStatus.INTERVIEW_SCHEDULED) {
      const daysAhead = 2 + i;
      await prisma.interviewSchedule.create({
        data: {
          applicationId: application.id,
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * daysAhead),
          location: "Google Meet",
          notes: "Entrevista técnica com o time de engenharia.",
        },
      });
    }
    if (status === ApplicationStatus.HIRED) {
      await prisma.interviewSchedule.create({
        data: {
          applicationId: application.id,
          scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          location: "Google Meet",
          notes: "Entrevista final — aprovado.",
        },
      });
    }

    console.log(`  Criado: ${c.name} — ${status}`);
  }

  console.log("Seed demo completo.");
}

function buildStageHistory(finalStatus: ApplicationStatus) {
  const order: ApplicationStatus[] = [
    ApplicationStatus.PENDING_CONTACT,
    ApplicationStatus.IN_SCREENING,
    ApplicationStatus.APPROVED,
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.HIRED,
  ];

  if (finalStatus === ApplicationStatus.REJECTED) {
    return [
      { status: ApplicationStatus.PENDING_CONTACT, note: "Candidato identificado via matching" },
      { status: ApplicationStatus.IN_SCREENING, note: "Triagem iniciada via WhatsApp" },
      { status: ApplicationStatus.REJECTED, note: "Respostas abaixo do esperado na triagem" },
    ];
  }

  const idx = order.indexOf(finalStatus);
  const path = order.slice(0, idx + 1);
  const notes: Record<string, string> = {
    PENDING_CONTACT: "Candidato identificado via matching",
    IN_SCREENING: "Triagem iniciada via WhatsApp",
    APPROVED: "Aprovado na triagem automática",
    INTERVIEW_SCHEDULED: "Entrevista agendada com o recrutador",
    HIRED: "Candidato contratado",
  };
  return path.map((status) => ({ status, note: notes[status] }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
