import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

const PARTICLE_COUNT = 28;

export const EpicRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;

  const logoScale = spring({
    frame,
    fps,
    from: 0.3,
    to: 1,
    config: { damping: 11, mass: 0.7 },
  });
  const logoOpacity = interpolate(frame, [10, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glowOpacity = interpolate(frame, [0, 25, 55], [0, 0.55, 0.3], {
    extrapolateRight: "clamp",
  });

  const subOpacity = interpolate(frame, [26, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = spring({
    frame: frame - 26,
    fps,
    from: 20,
    to: 0,
    config: { damping: 200 },
  });

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = random(`angle-${i}`) * Math.PI * 2;
    const dist = 700 + random(`dist-${i}`) * 500;
    const startX = cx + Math.cos(angle) * dist;
    const startY = cy + Math.sin(angle) * dist;
    const size = 4 + random(`size-${i}`) * 8;
    const delay = random(`delay-${i}`) * 10;

    const p = spring({
      frame: frame - delay,
      fps,
      from: 0,
      to: 1,
      config: { damping: 16, mass: 0.8 },
    });

    const x = interpolate(p, [0, 1], [startX, cx]);
    const y = interpolate(p, [0, 1], [startY, cy]);
    const opacity = interpolate(
      frame - delay,
      [0, 8, 20, 28],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return { x, y, size, opacity, key: i };
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

      {particles.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: theme.primaryLight,
            opacity: p.opacity,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

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
            fontSize: 100,
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
            fontSize: 38,
            fontWeight: 700,
          }}
        >
          Recrutamento em outra escala
        </span>
      </div>
    </AbsoluteFill>
  );
};
