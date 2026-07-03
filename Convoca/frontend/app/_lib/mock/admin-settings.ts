/**
 * MOCK DATA — sem endpoint de backend correspondente ainda.
 * A1 (dados gerais do tenant), A3 (SMTP), A4 (equipe) e A5 (segurança) são
 * explicitamente aspiracionais — ver Convoca/exemplo-front/uploads/admin.md.
 * Nenhuma chamada de rede deve ser feita a partir destes dados.
 */

export interface TenantGeneralInfo {
  displayName: string;
  legalName: string;
  plan: string;
  activeJobs: number;
}

export async function getMockTenantGeneral(): Promise<TenantGeneralInfo> {
  return { displayName: "Nexo Tech", legalName: "Nexo Tecnologia Ltda.", plan: "Growth", activeJobs: 8 };
}

export interface EmailLogEntry {
  icon: string;
  subject: string;
  to: string;
  time: string;
}

export async function getMockEmailLog(): Promise<EmailLogEntry[]> {
  return [
    { icon: "✅", subject: "Confirmação de candidatura — Backend Sênior", to: "mariana.c@email.com", time: "há 2h" },
    { icon: "✅", subject: "Novo candidato aprovado na triagem", to: "rafael@nexotech.com.br", time: "há 5h" },
    { icon: "⚠️", subject: "Falha no envio — endereço inválido", to: "contato@invalido", time: "há 1d" },
  ];
}

export interface TeamMember {
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  phone: string;
  lastAccess: string;
}

export async function getMockTeam(): Promise<TeamMember[]> {
  return [
    { name: "Rafael Alves", email: "rafael@nexotech.com.br", role: "TENANT_ADMIN", roleLabel: "Admin", phone: "+55 11 99123-4567", lastAccess: "agora" },
    { name: "Juliana Mendes", email: "juliana@nexotech.com.br", role: "RECRUITER", roleLabel: "Recrutadora", phone: "—", lastAccess: "há 3h" },
  ];
}

export interface ActiveSession {
  device: string;
  location: string;
  current: boolean;
}

export async function getMockSessions(): Promise<ActiveSession[]> {
  return [
    { device: "Chrome · Windows", location: "São Paulo, BR", current: true },
    { device: "Safari · iPhone", location: "São Paulo, BR", current: false },
  ];
}
