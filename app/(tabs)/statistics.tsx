import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { constantColors } from "@/constants/colors";
import { AppIcons } from "@/constants/icon";
import { useUserStore } from "@/hooks/useUserStore";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { scale } from "react-native-size-matters";

type BarDataItem = {
  value: number;
  label: string;
  frontColor?: string;
  topLabelComponent?: () => React.ReactElement;
};

const Statistics = () => {
  const { userHealthProfile, recommendedIntake } = useUserStore();

  // maxValue should update. should be at about recommendedamount + 400, but then gradually go higher if user goes above
  const waterGoal =
    userHealthProfile?.customWaterGoal || recommendedIntake || 2400;
  const maxValue = waterGoal + 800;

  const barData: BarDataItem[] = [
    { value: 2500, label: "Mo" },
    { value: 3500, label: "Tu" },
    { value: 1250, label: "We" },
    { value: 3400, label: "Th" },
    { value: 2600, label: "Fr" },
    { value: 2560, label: "Sa" },
    { value: 3000, label: "Su" },
  ];

  // If the water goal is reached the bar turns blue
  barData.forEach((dailyLog) => {
    dailyLog.value > waterGoal && (dailyLog.frontColor = constantColors.accent);
    dailyLog.topLabelComponent = () => (
      <Text
        style={{
          color: dailyLog.value > waterGoal ? "white" : constantColors.accent,
          fontSize: scale(11),
          fontWeight: "bold",
          marginBottom: scale(-22),
        }}
      >
        {(dailyLog.value / 1000).toFixed(1)}
      </Text>
    );
  });

  return (
    <ScreenBackgroundWrapper className="">
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingBottom: scale(130),
          display: "flex",
          gap: scale(35),
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="mt-10 flex flex-col bg-dark-secondary px-5 py-4 gap-3 rounded-xl">
          <View className="flex-row gap-2 items-center mb-2">
            <AppIcons.dropletFilled
              size={scale(17)}
              color={constantColors.accent}
            />
            <Text className="font-poppins-medium text-md text-white">
              {(waterGoal / 1000).toFixed(1) + "L"}
            </Text>
          </View>

          <BarChart
            barWidth={scale(28)}
            maxValue={maxValue}
            stepValue={maxValue}
            noOfSections={1}
            initialSpacing={0}
            endSpacing={0}
            spacing={scale(11)}
            hideRules
            xAxisLabelTextStyle={{ color: "white", fontSize: scale(12) }}
            // backgroundColor={"tomato"}
            hideYAxisText
            showReferenceLine1
            referenceLine1Position={waterGoal}
            referenceLine1Config={{
              color: "gray",
              dashWidth: scale(4),
              dashGap: scale(6),
            }}
            barBorderRadius={scale(8)}
            frontColor="lightgray"
            data={barData}
            yAxisThickness={0}
            xAxisThickness={0}
          />
        </View>
      </ScrollView>
    </ScreenBackgroundWrapper>
  );
};

export default Statistics;
