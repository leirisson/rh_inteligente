import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

const VIEWPORT_W = 1360;
const SOURCE_W = 2880;
const SOURCE_H = 1800;
const VIEWPORT_H = VIEWPORT_W * (SOURCE_H / SOURCE_W);

export const BrowserFrame: React.FC<{
  src: string;
  frame: number;
  fps: number;
  /** Slow zoom-in applied over the scene, as a scale multiplier added by the end. */
  zoomAmount?: number;
}> = ({ src, frame, fps, zoomAmount = 0.04 }) => {
  const entryScale = spring({
    frame,
    fps,
    from: 0.92,
    to: 1,
    config: { damping: 200 },
  });
  const entryOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
  });

  const kenBurns = interpolate(frame, [0, 900], [1, 1 + zoomAmount], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        transform: `scale(${entryScale})`,
        opacity: entryOpacity,
        width: VIEWPORT_W,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#1E2338",
        border: `1px solid #2A3150`,
        boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 18px",
          backgroundColor: "#1A1F33",
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF5F57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FEBC2E" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28C840" }} />
        <div
          style={{
            marginLeft: 12,
            flex: 1,
            backgroundColor: "#0F1424",
            borderRadius: 8,
            padding: "6px 14px",
            color: theme.textDim,
            fontSize: 13,
            fontFamily: "monospace",
          }}
        >
          localhost:3001
        </div>
      </div>
      <div
        style={{
          width: VIEWPORT_W,
          height: VIEWPORT_H,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Img
          src={src}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: VIEWPORT_W,
            height: VIEWPORT_H,
            transform: `scale(${kenBurns})`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
};
