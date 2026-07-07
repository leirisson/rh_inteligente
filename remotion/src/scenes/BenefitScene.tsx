import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

export const BenefitScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = spring({ frame, fps, from: 24, to: 0, config: { damping: 200 } });

  const checkScale = spring({
    frame: frame - 20,
    fps,
    from: 0,
    to: 1,
    config: { damping: 10 },
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
          opacity,
          transform: `translateY(${y}px)`,
          textAlign: "center",
          padding: "0 90px",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: theme.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 40px",
            transform: `scale(${checkScale})`,
          }}
        >
          <span style={{ fontSize: 64, color: theme.bg, fontWeight: 900 }}>
            ✓
          </span>
        </div>
        <div
          style={{
            color: theme.text,
            fontFamily,
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          Só os candidatos certos
          <br />
          chegam até você
        </div>
      </div>
    </AbsoluteFill>
  );
};
