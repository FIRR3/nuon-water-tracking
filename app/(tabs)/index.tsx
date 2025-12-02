import { LiquidProgressGauge } from "@/components/LiquidProgressGauge";
import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import React from "react";
import { Dimensions, ScrollView } from "react-native";

export default function Index() {
  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  return (
    <ScreenBackgroundWrapper className="flex-1">
      <ScrollView
        contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <LiquidProgressGauge
          width={windowWidth}
          height={windowHeight}
          value={160}
          maxValue={2400}
          userName="Firuz"
        />
      </ScrollView>
    </ScreenBackgroundWrapper>
  );
}