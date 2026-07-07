import { Composition } from "remotion";
import { PromoVideo, TOTAL_DURATION } from "./PromoVideo";
import { PromoEpic, EPIC_TOTAL_DURATION } from "./PromoEpic";
import { PromoScreenTour, TOUR_TOTAL_DURATION } from "./PromoScreenTour";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoVertical"
        component={PromoVideo}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PromoEpic"
        component={PromoEpic}
        durationInFrames={EPIC_TOTAL_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PromoScreenTour"
        component={PromoScreenTour}
        durationInFrames={TOUR_TOTAL_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
