import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, fontFamily } from "../theme";

export const SimpleIntroScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, from: 0.85, to: 1, config: { damping: 14, mass: 0.6 } });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{ backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center", padding: "0 80px" }}>
        <div
          style={{
            color: theme.text,
            fontFamily,
            fontSize: 78,
            fontWeight: 900,
            letterSpacing: -1.5,
            marginBottom: 18,
          }}
        >
          Convoca
        </div>
        <div style={{ color: theme.primaryLight, fontFamily, fontSize: 32, fontWeight: 700 }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
