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
  /** ISO date-time — fonte única de verdade para agrupamento por dia no calendário. */
  date: string;
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
      date: "2026-07-10T14:30:00",
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
      date: "2026-07-11T10:00:00",
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
      date: "2026-07-12T16:00:00",
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
      date: "2026-07-09T09:30:00",
      month: "JUL",
      day: "09",
      hour: "09:30",
      status: "CANCELLED",
    },
    {
      id: "mock-iv-5",
      candidateName: "Camila Souza",
      jobTitle: "Product Designer",
      interviewer: "Juliana Mendes",
      place: "meet.google.com/dsg-poi",
      date: "2026-07-10T09:00:00",
      month: "JUL",
      day: "10",
      hour: "09:00",
      status: "SCHEDULED",
    },
    {
      id: "mock-iv-6",
      candidateName: "Bruno Carvalho",
      jobTitle: "Backend Sênior",
      interviewer: "Rafael Alves",
      place: "Sala 1 · Escritório SP",
      date: "2026-07-10T17:00:00",
      month: "JUL",
      day: "10",
      hour: "17:00",
      status: "SCHEDULED",
    },
  ];
}
