/**
 * MOCK DATA — sem endpoint de backend correspondente ainda.
 * Convoca/api/src/modules/interview/interview.routes.ts expõe apenas
 * POST/PATCH (agendar/reagendar/cancelar), sem GET de listagem consolidada.
 * Endpoint futuro sugerido: GET /interviews (todas as entrevistas do tenant, paginado).
 */

import type { InterviewStatus } from "@/app/_lib/api/types";

export interface InterviewListItem {
  id: string;
  candidateName: string;
  jobTitle: string;
  interviewer: string;
  place: string;
  month: string;
  day: string;
  hour: string;
  status: InterviewStatus;
}

export async function getMockInterviews(): Promise<InterviewListItem[]> {
  return [
    {
      id: "mock-iv-1",
      candidateName: "Lucas Martins",
      jobTitle: "Backend Sênior",
      interviewer: "Rafael Alves",
      place: "meet.google.com/xza-qwe",
      month: "JUL",
      day: "10",
      hour: "14:30",
      status: "SCHEDULED",
    },
    {
      id: "mock-iv-2",
      candidateName: "Fernanda Reis",
      jobTitle: "Product Designer",
      interviewer: "Juliana Mendes",
      place: "Sala 3 · Escritório SP",
      month: "JUL",
      day: "11",
      hour: "10:00",
      status: "SCHEDULED",
    },
    {
      id: "mock-iv-3",
      candidateName: "Gustavo Pinto",
      jobTitle: "Customer Success",
      interviewer: "Rafael Alves",
      place: "meet.google.com/abc-rty",
      month: "JUL",
      day: "12",
      hour: "16:00",
      status: "RESCHEDULED",
    },
    {
      id: "mock-iv-4",
      candidateName: "Helena Braga",
      jobTitle: "Backend Sênior",
      interviewer: "Juliana Mendes",
      place: "—",
      month: "JUL",
      day: "09",
      hour: "09:30",
      status: "CANCELLED",
    },
  ];
}
