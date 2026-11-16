import React from "react";
import { Composition } from "remotion";
import { BHShort } from "./videos/bh/BH";
import { TOTAL } from "./videos/bh/story";
export const Root: React.FC = () => (
  <>
    <Composition id="AgujeroNegro" component={BHShort} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  </>
);
