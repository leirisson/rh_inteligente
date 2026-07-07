import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

const StepLabel: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = spring({ frame, fps, from: 16, to: 0, config: { damping: 200 } });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        color: theme.textDim,
        fontFamily,
        fontSize: 30,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 18,
      }}
    >
      {text}
    </div>
  );
};

export const FlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Step 1: Job card (0-70)
  const jobOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const jobScale = spring({
    frame,
    fps,
    from: 0.9,
    to: 1,
    config: { damping: 200 },
  });
  const jobExit = interpolate(frame, [70, 85], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Step 2: Match score (75-160)
  const matchFrame = frame - 80;
  const matchOpacity = interpolate(matchFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const matchExit = interpolate(matchFrame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scoreValue = Math.round(
    interpolate(matchFrame, [10, 55], [0, 94], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Step 3: WhatsApp message (165-240)
  const waFrame = frame - 170;
  const waOpacity = interpolate(waFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bubbleY = spring({
    frame: waFrame,
    fps,
    from: 40,
    to: 0,
    config: { damping: 200 },
  });

  const showJob = frame < 90;
  const showMatch = frame >= 75 && frame < 170;
  const showWa = frame >= 165;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {showJob && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: jobOpacity * jobExit,
          }}
        >
          <div style={{ transform: `scale(${jobScale})`, textAlign: "center" }}>
            <StepLabel text="Vaga publicada" frame={frame} fps={fps} />
            <div
              style={{
                width: 620,
                backgroundColor: theme.card,
                borderRadius: 20,
                padding: 36,
                border: `1px solid ${theme.bgAlt}`,
                boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  color: theme.text,
                  fontFamily,
                  fontSize: 34,
                  fontWeight: 800,
                  marginBottom: 10,
                  textAlign: "left",
                }}
              >
                Desenvolvedor(a) Backend
              </div>
              <div
                style={{
                  color: theme.textDim,
                  fontFamily,
                  fontSize: 24,
                  textAlign: "left",
                  marginBottom: 20,
                }}
              >
                Node.js · TypeScript · Remoto
              </div>
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: theme.accent,
                  color: theme.bg,
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 20,
                  padding: "8px 18px",
                  borderRadius: 999,
                }}
              >
                ATIVA
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {showMatch && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: matchOpacity * matchExit,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <StepLabel text="Match por IA" frame={matchFrame} fps={fps} />
            <div
              style={{
                width: 300,
                height: 300,
                borderRadius: "50%",
                backgroundColor: theme.card,
                border: `10px solid ${theme.primary}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <span
                style={{
                  color: theme.text,
                  fontFamily,
                  fontSize: 72,
                  fontWeight: 900,
                }}
              >
                {scoreValue}%
              </span>
            </div>
            <div
              style={{
                color: theme.text,
                fontFamily,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              compatível com a vaga
            </div>
          </div>
        </AbsoluteFill>
      )}

      {showWa && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: waOpacity,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <StepLabel text="Contato automático" frame={waFrame} fps={fps} />
            <div
              style={{
                width: 600,
                backgroundColor: "#25D366",
                borderRadius: "24px 24px 24px 4px",
                padding: 32,
                transform: `translateY(${bubbleY}px)`,
                boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  color: "#052E1A",
                  fontFamily,
                  fontSize: 26,
                  fontWeight: 600,
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                Olá! Vi seu perfil e você tem tudo a ver com uma vaga de
                Backend aberta agora. Posso te fazer algumas perguntas
                rápidas? 👋
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
