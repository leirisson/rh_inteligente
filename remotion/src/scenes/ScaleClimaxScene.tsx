import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "../theme";

const names = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Erica",
  "Felipe",
  "Gabriela",
  "Hugo",
  "Isa",
  "João",
  "Karina",
  "Lucas",
  "Marina",
  "Nando",
  "Olivia",
  "Paulo",
  "Rafa",
  "Sofia",
  "Tiago",
  "Vitor",
  "Wesley",
  "Yasmin",
  "Zeca",
  "Bia",
];

const snippets = [
  "Oi! Vi seu perfil...",
  "Você topa uma conversa?",
  "Compatível com a vaga!",
  "Posso te fazer perguntas?",
  "Qual sua experiência com...",
  "Ótimo, vamos seguir!",
  "Obrigado pela resposta",
  "Você foi selecionado 🎉",
];

const COLS = 4;
const ROWS = 6;

export const ScaleClimaxScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 12, 130, 145], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cellW = width / COLS;
  const cellH = (height - 260) / ROWS;

  const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const delay = 10 + random(`d-${i}`) * 55;
    const localFrame = frame - delay;

    const scale = spring({
      frame: localFrame,
      fps,
      from: 0.4,
      to: 1,
      config: { damping: 12, mass: 0.5 },
    });
    const opacity = interpolate(localFrame, [0, 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const name = names[i % names.length];
    const snippet = snippets[i % snippets.length];

    return {
      key: i,
      x: col * cellW + cellW / 2,
      y: 240 + row * cellH + cellH / 2,
      scale,
      opacity,
      name,
      snippet,
    };
  });

  const zoomFrame = frame - 150;
  const zoomScale = interpolate(zoomFrame, [0, 40], [1, 2.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoomOpacity = interpolate(zoomFrame, [0, 40], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          textAlign: "center",
          paddingTop: 90,
          opacity: titleOpacity,
          zIndex: 10,
        }}
      >
        <span
          style={{
            color: theme.text,
            fontFamily,
            fontSize: 34,
            fontWeight: 800,
          }}
        >
          Um agente. Centenas de conversas.
        </span>
      </div>

      <div
        style={{
          transform: `scale(${zoomScale})`,
          opacity: zoomOpacity,
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {cells.map((c) => (
          <div
            key={c.key}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              transform: `translate(-50%, -50%) scale(${c.scale})`,
              opacity: c.opacity,
              width: cellW - 14,
              maxWidth: 230,
              backgroundColor: "#25D366",
              borderRadius: 12,
              padding: "10px 12px",
              boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                color: "#052E1A",
                fontFamily,
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 3,
              }}
            >
              {c.name}
            </div>
            <div
              style={{
                color: "#0B3B22",
                fontFamily,
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {c.snippet}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
