/**
 * MOCK DATA — sem endpoint de backend correspondente ainda.
 * Ver Convoca/api/src/modules/application/funnel.routes.ts (existe apenas contagem agregada
 * por status via GET /jobs/:jobId/funnel, não uma lista de candidatos por vaga).
 * Endpoint futuro sugerido: GET /jobs/:jobId/candidates (com nome, score, canal, tempo na fase).
 */

export interface FunnelCard {
  applicationId: string;
  name: string;
  initials: string;
  avBg: string;
  avColor: string;
  match: number;
  channel: "whatsapp" | "email";
  time: string;
  triaging: boolean;
}

export interface FunnelColumn {
  title: string;
  cards: FunnelCard[];
}

const avatarPalette = [
  { bg: "#EEF2FF", color: "#4F46E5" },
  { bg: "#F5F3FF", color: "#8B5CF6" },
  { bg: "#ECFDF5", color: "#059669" },
  { bg: "#FFF7ED", color: "#EA580C" },
];

function makeCard(
  index: number,
  name: string,
  match: number,
  channel: "whatsapp" | "email",
  time: string,
  triaging: boolean,
): FunnelCard {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const palette = avatarPalette[index % avatarPalette.length];
  return {
    applicationId: `mock-app-${index}`,
    name,
    initials,
    avBg: palette.bg,
    avColor: palette.color,
    match,
    channel,
    time,
    triaging,
  };
}

export async function getMockFunnelBoard(): Promise<FunnelColumn[]> {
  return [
    {
      title: "Aguardando Contato",
      cards: [
        makeCard(0, "Bruno Ferreira", 74, "email", "3h", false),
        makeCard(1, "Camila Rocha", 81, "whatsapp", "5h", false),
      ],
    },
    {
      title: "Em Triagem",
      cards: [
        makeCard(2, "Mariana Costa", 87, "whatsapp", "1h", true),
        makeCard(3, "Diego Alves", 79, "whatsapp", "2h", true),
        makeCard(4, "Patrícia Lima", 69, "email", "6h", true),
      ],
    },
    {
      title: "Aprovado",
      cards: [
        makeCard(5, "Rafael Souza", 91, "whatsapp", "1d", false),
        makeCard(6, "Tânia Melo", 84, "whatsapp", "2d", false),
      ],
    },
    {
      title: "Entrevista Agendada",
      cards: [makeCard(7, "Lucas Martins", 88, "whatsapp", "3d", false)],
    },
    {
      title: "Reprovado",
      cards: [
        makeCard(8, "Igor Nunes", 52, "email", "4d", false),
        makeCard(9, "Sofia Dias", 58, "whatsapp", "5d", false),
      ],
    },
  ];
}
