import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

export const RevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    from: 0.4,
    to: 1,
    config: { damping: 12, mass: 0.6 },
  });
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const glowOpacity = interpolate(frame, [0, 20, 40], [0, 0.5, 0.25], {
    extrapolateRight: "clamp",
  });

  const subOpacity = interpolate(frame, [18, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = spring({
    frame: frame - 18,
    fps,
    from: 20,
    to: 0,
    config: { damping: 200 },
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
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.primary} 0%, transparent 70%)`,
          opacity: glowOpacity,
        }}
      />

      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: theme.text,
            fontFamily,
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -2,
          }}
        >
          Convoca
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "58%",
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          textAlign: "center",
          padding: "0 90px",
        }}
      >
        <span
          style={{
            color: theme.primaryLight,
            fontFamily,
            fontSize: 40,
            fontWeight: 700,
          }}
        >
          A IA que faz a triagem por você
        </span>
      </div>
    </AbsoluteFill>
  );
};
