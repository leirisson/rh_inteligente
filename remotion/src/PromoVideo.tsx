import { AbsoluteFill, Series } from "remotion";
import { PainScene } from "./scenes/PainScene";
import { RevealScene } from "./scenes/RevealScene";
import { FlowScene } from "./scenes/FlowScene";
import { BenefitScene } from "./scenes/BenefitScene";
import { CtaScene } from "./scenes/CtaScene";
import { theme } from "./theme";

export const PAIN_DURATION = 110;
export const REVEAL_DURATION = 70;
export const FLOW_DURATION = 240;
export const BENEFIT_DURATION = 90;
export const CTA_DURATION = 90;

export const TOTAL_DURATION =
  PAIN_DURATION +
  REVEAL_DURATION +
  FLOW_DURATION +
  BENEFIT_DURATION +
  CTA_DURATION;

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <Series>
        <Series.Sequence durationInFrames={PAIN_DURATION}>
          <PainScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={REVEAL_DURATION}>
          <RevealScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={FLOW_DURATION}>
          <FlowScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BENEFIT_DURATION}>
          <BenefitScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={CTA_DURATION}>
          <CtaScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
