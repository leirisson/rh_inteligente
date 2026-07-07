import { AbsoluteFill, Audio, Series, interpolate, staticFile } from "remotion";
import { SimpleIntroScene } from "./scenes/SimpleIntroScene";
import { ScreenTourScene } from "./scenes/ScreenTourScene";
import { CtaScene } from "./scenes/CtaScene";
import { theme } from "./theme";

export const INTRO_DURATION = 90;
export const STEP_DURATION = 120;
export const CHAT_STEP_DURATION = 210;
export const TOUR_CTA_DURATION = 120;

const steps: {
  image: string;
  caption: string;
  focusX: number;
  focusY: number;
  focusWidth: number;
  duration: number;
}[] = [
  {
    image: "screens/01-login.png",
    caption: "Acesso simples para sua equipe",
    focusX: 480,
    focusY: 590,
    focusWidth: 1900,
    duration: STEP_DURATION,
  },
  {
    image: "screens/02-vagas-lista.png",
    caption: "Publique vagas e ative o agente de IA",
    focusX: 180,
    focusY: 140,
    focusWidth: 1750,
    duration: STEP_DURATION,
  },
  {
    image: "screens/03-vaga-nova.png",
    caption: "Criação de vaga em segundos",
    focusX: 380,
    focusY: 100,
    focusWidth: 1600,
    duration: STEP_DURATION,
  },
  {
    image: "screens/04-funil.png",
    caption: "Acompanhe candidatos em cada etapa",
    focusX: 0,
    focusY: 400,
    focusWidth: 1750,
    duration: STEP_DURATION,
  },
  {
    image: "screens/05-candidato-chat.png",
    caption: "A IA conduz a triagem via WhatsApp",
    focusX: 0,
    focusY: 330,
    focusWidth: 1750,
    duration: CHAT_STEP_DURATION,
  },
  {
    image: "screens/06-entrevistas.png",
    caption: "Entrevistas organizadas automaticamente",
    focusX: 760,
    focusY: 420,
    focusWidth: 1500,
    duration: STEP_DURATION,
  },
  {
    image: "screens/07-config-whatsapp.png",
    caption: "Conecte o WhatsApp da empresa em minutos",
    focusX: 0,
    focusY: 0,
    focusWidth: 2100,
    duration: STEP_DURATION,
  },
];

export const TOUR_TOTAL_DURATION =
  INTRO_DURATION + steps.reduce((sum, s) => sum + s.duration, 0) + TOUR_CTA_DURATION;

const musicVolume = (frame: number) =>
  interpolate(
    frame,
    [0, 30, TOUR_TOTAL_DURATION - 60, TOUR_TOTAL_DURATION],
    [0, 0.28, 0.28, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

export const PromoScreenTour: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <Audio
        src={staticFile("alexguz-funk-amp-breakbeat-541097.mp3")}
        volume={musicVolume}
      />
      <Series>
        <Series.Sequence durationInFrames={INTRO_DURATION}>
          <SimpleIntroScene text="Conheça o Convoca" />
        </Series.Sequence>

        {steps.map((step) => (
          <Series.Sequence key={step.image} durationInFrames={step.duration}>
            <ScreenTourScene
              image={step.image}
              caption={step.caption}
              focusX={step.focusX}
              focusY={step.focusY}
              focusWidth={step.focusWidth}
            />
          </Series.Sequence>
        ))}

        <Series.Sequence durationInFrames={TOUR_CTA_DURATION}>
          <CtaScene tagline="Recrutamento inteligente" />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
