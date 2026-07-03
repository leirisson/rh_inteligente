/**
 * MOCK DATA — sem endpoint de backend correspondente ainda.
 * Conversation e ScreeningAnswer existem no schema Prisma (Convoca/api/prisma/schema.prisma)
 * mas não têm endpoint REST de leitura — são manipulados internamente por
 * application.service.ts (processCandidateMessage). Endpoint futuro sugerido:
 * GET /applications/:id (detalhe com conversa + respostas + perfil do candidato).
 */

export interface ChatMessage {
  sender: "AGENT" | "CANDIDATE";
  text: string;
  time: string;
}

export interface ScreeningAnswerView {
  question: string;
  answer: string;
  adequate: boolean;
}

export interface CandidateProfile {
  applicationId: string;
  jobTitle: string;
  candidateName: string;
  initials: string;
  status: string;
  email: string;
  phone: string;
  channel: "WhatsApp" | "E-mail";
  matchScore: number;
  chat: ChatMessage[];
  answers: ScreeningAnswerView[];
}

const chat: ChatMessage[] = [
  {
    sender: "AGENT",
    text: "Olá, Mariana! Sou o agente da Nexo Tech. Seu perfil combina com a vaga de Backend Sênior — posso fazer algumas perguntas rápidas?",
    time: "14:02",
  },
  { sender: "CANDIDATE", text: "Oi! Claro, pode perguntar.", time: "14:03" },
  { sender: "AGENT", text: "Quantos anos de experiência você tem com Node.js?", time: "14:03" },
  {
    sender: "CANDIDATE",
    text: "Trabalho com Node há ~5 anos, os últimos 3 liderando serviços em produção.",
    time: "14:05",
  },
  { sender: "AGENT", text: "Ótimo. E com bancos relacionais, como PostgreSQL?", time: "14:05" },
  {
    sender: "CANDIDATE",
    text: "Sim, uso PostgreSQL diariamente — incluindo tuning de queries e modelagem.",
    time: "14:07",
  },
  { sender: "AGENT", text: "Perfeito. Qual sua disponibilidade para início?", time: "14:07" },
  { sender: "CANDIDATE", text: "Posso começar em 30 dias.", time: "14:08" },
];

export async function getMockCandidateProfile(applicationId: string): Promise<CandidateProfile> {
  return {
    applicationId,
    jobTitle: "Desenvolvedor Backend Sênior",
    candidateName: "Mariana Costa",
    initials: "MC",
    status: "IN_SCREENING",
    email: "mariana.c@email.com",
    phone: "+55 11 9****-4821",
    channel: "WhatsApp",
    matchScore: 87,
    chat,
    answers: [
      { question: "Experiência com Node.js", answer: "5 anos, 3 liderando produção", adequate: true },
      {
        question: "Bancos relacionais (PostgreSQL)",
        answer: "Uso diário, tuning e modelagem",
        adequate: true,
      },
      { question: "Disponibilidade de início", answer: "30 dias", adequate: true },
    ],
  };
}
