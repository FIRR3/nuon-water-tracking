import { LiquidProgressGauge } from "@/components/LiquidProgressGauge";
import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import React from "react";
import { Dimensions } from "react-native";

export default function Index() {
  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  return (
    <ScreenBackgroundWrapper className="flex-1 items-center justify-center">
      <LiquidProgressGauge
        width={windowWidth}
        height={windowHeight}
        value={200}
      />
    </ScreenBackgroundWrapper>
  );
}