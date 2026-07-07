import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

const stackItems = [
  { label: "curriculo_ana.pdf" },
  { label: "curriculo_bruno.pdf" },
  { label: "curriculo_carla.pdf" },
  { label: "curriculo_diego.pdf" },
  { label: "curriculo_erica.pdf" },
];

export const PainScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = spring({
    frame,
    fps,
    from: 30,
    to: 0,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <div
        style={{
          position: "absolute",
          top: 260,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          <div
            style={{
              color: theme.text,
              fontFamily,
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.25,
            }}
          >
            Triar currículos
            <br />
            ainda toma
            <br />
            seu dia inteiro?
          </div>
        </div>
      </div>

      <AbsoluteFill style={{ alignItems: "center", top: 850, bottom: 0 }}>
        {stackItems.map((item, i) => {
          const delay = i * 4;
          const cardFrame = frame - delay;
          const cardOpacity = interpolate(cardFrame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardX = spring({
            frame: cardFrame,
            fps,
            from: -400,
            to: 0,
            config: { damping: 200 },
          });
          const rotate = (i % 2 === 0 ? -1 : 1) * (2 + i);

          return (
            <div
              key={item.label}
              style={{
                position: "absolute",
                top: i * 108,
                width: 560,
                height: 90,
                backgroundColor: theme.card,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                paddingLeft: 28,
                opacity: cardOpacity,
                transform: `translateX(${cardX}px) rotate(${rotate}deg)`,
                boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                border: `1px solid ${theme.bgAlt}`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: theme.danger,
                  opacity: 0.15,
                  marginRight: 20,
                }}
              />
              <span
                style={{
                  color: theme.textDim,
                  fontFamily,
                  fontSize: 26,
                  fontWeight: 600,
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
