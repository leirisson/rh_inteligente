import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

const stages = [
  { label: "Contatados", value: 347, width: 620 },
  { label: "Responderam", value: 189, width: 480 },
  { label: "Triagem aprovada", value: 41, width: 300 },
  { label: "Prontos p/ entrevista", value: 12, width: 160 },
];

export const FunnelMockScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
          top: 260,
          opacity: labelOpacity,
          color: theme.textDim,
          fontFamily,
          fontSize: 30,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        Funil de triagem
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {stages.map((s, i) => {
          const delay = 12 + i * 14;
          const localFrame = frame - delay;
          const widthP = spring({
            frame: localFrame,
            fps,
            from: 0,
            to: 1,
            config: { damping: 200 },
          });
          const opacity = interpolate(localFrame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isLast = i === stages.length - 1;

          return (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity,
              }}
            >
              <div
                style={{
                  width: s.width * widthP,
                  height: 68,
                  borderRadius: 14,
                  backgroundColor: isLast ? theme.accent : theme.primary,
                  opacity: isLast ? 1 : 0.55 + i * 0.15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 18,
                }}
              >
                <span
                  style={{
                    color: isLast ? theme.bg : theme.text,
                    fontFamily,
                    fontWeight: 900,
                    fontSize: 26,
                  }}
                >
                  {s.value}
                </span>
              </div>
              <span
                style={{
                  color: theme.textDim,
                  fontFamily,
                  fontSize: 22,
                  fontWeight: 700,
                  width: 260,
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
