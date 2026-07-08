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
  duration: number;
}[] = [
  {
    image: "screens/01-login.png",
    caption: "Acesso simples para sua equipe",
    duration: STEP_DURATION,
  },
  {
    image: "screens/02-vagas-lista.png",
    caption: "Publique vagas e ative o agente de IA",
    duration: STEP_DURATION,
  },
  {
    image: "screens/03-vaga-nova.png",
    caption: "Criação de vaga em segundos",
    duration: STEP_DURATION,
  },
  {
    image: "screens/04-funil.png",
    caption: "Acompanhe candidatos em cada etapa",
    duration: STEP_DURATION,
  },
  {
    image: "screens/05-candidato-chat.png",
    caption: "A IA conduz a triagem via WhatsApp",
    duration: CHAT_STEP_DURATION,
  },
  {
    image: "screens/06-entrevistas.png",
    caption: "Entrevistas organizadas automaticamente",
    duration: STEP_DURATION,
  },
  {
    image: "screens/07-config-whatsapp.png",
    caption: "Conecte o WhatsApp da empresa em minutos",
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
            <ScreenTourScene image={step.image} caption={step.caption} />
          </Series.Sequence>
        ))}

        <Series.Sequence durationInFrames={TOUR_CTA_DURATION}>
          <CtaScene tagline="Recrutamento inteligente" />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
