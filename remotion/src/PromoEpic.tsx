import {
  AbsoluteFill,
  Audio,
  Sequence,
  Series,
  interpolate,
  staticFile,
} from "remotion";
import { ColdOpenScene } from "./scenes/ColdOpenScene";
import { EpicRevealScene } from "./scenes/EpicRevealScene";
import { DashboardMockScene } from "./scenes/DashboardMockScene";
import { ScaleClimaxScene } from "./scenes/ScaleClimaxScene";
import { FunnelMockScene } from "./scenes/FunnelMockScene";
import { ProofScene } from "./scenes/ProofScene";
import { CtaScene } from "./scenes/CtaScene";
import { theme } from "./theme";

export const COLD_OPEN_DURATION = 65;
export const EPIC_REVEAL_DURATION = 55;
export const DASHBOARD_DURATION = 110;
export const SCALE_CLIMAX_DURATION = 195;
export const FUNNEL_DURATION = 115;
export const PROOF_DURATION = 110;
export const EPIC_CTA_DURATION = 90;

export const EPIC_TOTAL_DURATION =
  COLD_OPEN_DURATION +
  EPIC_REVEAL_DURATION +
  DASHBOARD_DURATION +
  SCALE_CLIMAX_DURATION +
  FUNNEL_DURATION +
  PROOF_DURATION +
  EPIC_CTA_DURATION;

const fadeVolume =
  (durationInFrames: number, fadeIn = 12, fadeOut = 24) =>
  (frame: number) =>
    interpolate(
      frame,
      [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

export const PromoEpic: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {/* Whoosh suave de fundo cobrindo a abertura */}
      <Sequence from={0} durationInFrames={COLD_OPEN_DURATION + EPIC_REVEAL_DURATION}>
        <Audio
          src={staticFile(
            "viralaudio-descent-whoosh-long-cinematic-sound-effect-405921.mp3"
          )}
          volume={fadeVolume(COLD_OPEN_DURATION + EPIC_REVEAL_DURATION, 20, 30)}
        />
      </Sequence>

      {/* Transição cinematográfica no reveal da marca */}
      <Sequence from={COLD_OPEN_DURATION - 8} durationInFrames={110}>
        <Audio
          src={staticFile("dragon-studio-cinematic-flashback-transition-463199.mp3")}
          volume={fadeVolume(110, 6, 40)}
        />
      </Sequence>

      {/* Notificação sutil quando a vaga vira ATIVA */}
      <Sequence
        from={COLD_OPEN_DURATION + EPIC_REVEAL_DURATION + 28}
        durationInFrames={40}
      >
        <Audio
          src={staticFile("dragon-studio-new-notification-3-398649.mp3")}
          volume={fadeVolume(40, 4, 20)}
        />
      </Sequence>

      {/* Impulso curto entrando no clímax de escala */}
      <Sequence
        from={COLD_OPEN_DURATION + EPIC_REVEAL_DURATION + DASHBOARD_DURATION - 10}
        durationInFrames={60}
      >
        <Audio
          src={staticFile(
            "viralaudio-descent-whoosh-long-cinematic-sound-effect-405921123.mp3"
          )}
          volume={fadeVolume(60, 8, 25)}
        />
      </Sequence>

      {/* Notificações sutis pontuando o clímax de mensagens */}
      {[40, 90, 140].map((offset) => (
        <Sequence
          key={offset}
          from={
            COLD_OPEN_DURATION +
            EPIC_REVEAL_DURATION +
            DASHBOARD_DURATION +
            offset
          }
          durationInFrames={35}
        >
          <Audio
            src={staticFile("dragon-studio-new-notification-3-398649.mp3")}
            volume={0.35}
          />
        </Sequence>
      ))}

      {/* Whoosh suave na resolução do funil */}
      <Sequence
        from={
          COLD_OPEN_DURATION +
          EPIC_REVEAL_DURATION +
          DASHBOARD_DURATION +
          SCALE_CLIMAX_DURATION -
          15
        }
        durationInFrames={130}
      >
        <Audio
          src={staticFile(
            "viralaudio-descent-whoosh-long-cinematic-sound-effect-405921.mp3"
          )}
          volume={fadeVolume(130, 15, 50)}
        />
      </Sequence>

      <Series>
        <Series.Sequence durationInFrames={COLD_OPEN_DURATION}>
          <ColdOpenScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={EPIC_REVEAL_DURATION}>
          <EpicRevealScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={DASHBOARD_DURATION}>
          <DashboardMockScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCALE_CLIMAX_DURATION}>
          <ScaleClimaxScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={FUNNEL_DURATION}>
          <FunnelMockScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={PROOF_DURATION}>
          <ProofScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={EPIC_CTA_DURATION}>
          <CtaScene tagline="Recrutamento em outra escala" />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
