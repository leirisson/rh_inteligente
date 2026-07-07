import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

const PhoneFrame: React.FC<{ children: React.ReactNode; scale: number; opacity: number }> = ({
  children,
  scale,
  opacity,
}) => (
  <div
    style={{
      transform: `scale(${scale})`,
      opacity,
      width: 780,
      borderRadius: 40,
      backgroundColor: theme.bgAlt,
      border: `2px solid #262f4a`,
      boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
      padding: 28,
    }}
  >
    {children}
  </div>
);

export const DashboardMockScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entryScale = spring({
    frame,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 200 },
  });
  const entryOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
  });

  const statusFrame = frame - 30;
  const statusFlip = interpolate(statusFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isActive = statusFlip > 0.5;

  const pulseScale = 1 + Math.sin(frame / 5) * (isActive ? 0.04 : 0);

  const labelOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 300,
          opacity: labelOpacity,
          color: theme.textDim,
          fontFamily,
          fontSize: 30,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        Vaga publicada
      </div>

      <PhoneFrame scale={entryScale} opacity={entryOpacity}>
        <div
          style={{
            color: theme.textDim,
            fontFamily,
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 18,
          }}
        >
          Convoca · Painel de vagas
        </div>

        <div
          style={{
            backgroundColor: theme.card,
            borderRadius: 22,
            padding: 32,
            border: `1px solid #262f4a`,
          }}
        >
          <div
            style={{
              color: theme.text,
              fontFamily,
              fontSize: 40,
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Desenvolvedor(a) Backend
          </div>
          <div
            style={{
              color: theme.textDim,
              fontFamily,
              fontSize: 26,
              marginBottom: 26,
            }}
          >
            Node.js · TypeScript · Remoto
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: isActive ? theme.accent : "#3A4160",
              color: isActive ? theme.bg : theme.textDim,
              fontFamily,
              fontWeight: 800,
              fontSize: 22,
              padding: "10px 22px",
              borderRadius: 999,
              transform: `scale(${pulseScale})`,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: isActive ? theme.bg : theme.textDim,
              }}
            />
            {isActive ? "ATIVA" : "RASCUNHO"}
          </div>
        </div>
      </PhoneFrame>
    </AbsoluteFill>
  );
};
