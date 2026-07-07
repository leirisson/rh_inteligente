import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

export const CtaScene: React.FC<{ tagline?: string }> = ({
  tagline = "Recrutamento inteligente",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 14, mass: 0.6 },
  });
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [15, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulse = 1 + Math.sin(frame / 8) * 0.02;

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
          transform: `scale(${scale * pulse})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: theme.text,
            fontFamily,
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: -2,
            marginBottom: 24,
          }}
        >
          Convoca
        </div>
        <div
          style={{
            opacity: taglineOpacity,
            color: theme.primaryLight,
            fontFamily,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          {tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};
