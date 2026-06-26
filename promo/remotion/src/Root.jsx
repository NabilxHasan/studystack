import React from "react";
import { Composition } from "remotion";
import { LaunchVideo, TOTAL } from "./Video";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Launch"
        component={LaunchVideo}
        durationInFrames={TOTAL}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LaunchWide"
        component={LaunchVideo}
        durationInFrames={TOTAL}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
