import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

const lines = [
  { text: "1 agente.", color: "" },
  { text: "Centenas de conversas.", color: "" },
  { text: "Zero triagem manual.", color: theme.accent },
];

export const ProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", padding: "0 70px" }}>
        {lines.map((line, i) => {
          const delay = i * 16;
          const localFrame = frame - delay;
          const opacity = interpolate(localFrame, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = spring({
            frame: localFrame,
            fps,
            from: 26,
            to: 0,
            config: { damping: 200 },
          });

          return (
            <div
              key={line.text}
              style={{
                opacity,
                transform: `translateY(${y}px)`,
                color: line.color || theme.text,
                fontFamily,
                fontSize: 58,
                fontWeight: 900,
                lineHeight: 1.3,
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
