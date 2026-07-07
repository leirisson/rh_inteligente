import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { theme, fontFamily } from "../theme";

export const ScreenTourScene: React.FC<{
  image: string;
  caption: string;
  focusX?: number;
  focusY?: number;
  focusWidth?: number;
}> = ({ image, caption, focusX, focusY, focusWidth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const captionY = spring({
    frame: frame - 8,
    fps,
    from: 24,
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
      <div style={{ position: "absolute", top: 260 }}>
        <BrowserFrame
          src={staticFile(image)}
          frame={frame}
          fps={fps}
          focusX={focusX}
          focusY={focusY}
          focusWidth={focusWidth}
        />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 220,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            opacity: captionOpacity,
            transform: `translateY(${captionY}px)`,
            textAlign: "center",
            backgroundColor: theme.card,
            border: `1px solid #2A3150`,
            borderRadius: 16,
            padding: "20px 32px",
          }}
        >
          <span
            style={{
              color: theme.text,
              fontFamily,
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            {caption}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
