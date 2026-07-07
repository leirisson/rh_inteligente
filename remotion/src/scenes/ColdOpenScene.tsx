import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

export const ColdOpenScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Opacity = interpolate(frame, [0, 12, 40, 52], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line2Opacity = interpolate(frame, [45, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const counterFrame = frame - 45;
  const counterValue = Math.min(
    23,
    Math.floor(interpolate(counterFrame, [0, 55], [0, 23], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }))
  );

  const flash = interpolate(frame, [45, 47, 49], [0, 0.35, 0], {
    extrapolateLeft: "clamp",
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
      <AbsoluteFill style={{ backgroundColor: theme.primary, opacity: flash }} />

      <div style={{ textAlign: "center", padding: "0 90px" }}>
        <div
          style={{
            opacity: line1Opacity,
            color: theme.textDim,
            fontFamily,
            fontSize: 42,
            fontWeight: 700,
            marginBottom: 28,
          }}
        >
          Enquanto você lê isso...
        </div>

        <div style={{ opacity: line2Opacity }}>
          <span
            style={{
              color: theme.accent,
              fontFamily,
              fontSize: 96,
              fontWeight: 900,
            }}
          >
            {counterValue}
          </span>
          <div
            style={{
              color: theme.text,
              fontFamily,
              fontSize: 38,
              fontWeight: 800,
              marginTop: 12,
            }}
          >
            candidatos já foram triados
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
