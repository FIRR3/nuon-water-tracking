import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { constantColors, darkColors } from "@/constants/colors";
import { AppIcons } from "@/constants/icon";
import { useUserStore } from "@/hooks/useUserStore";
import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { scale } from "react-native-size-matters";
import Svg, { Circle } from "react-native-svg";

type BarDataItem = {
  value: number;
  label: string;
  frontColor?: string;
  topLabelComponent?: () => React.ReactElement;
};

const Statistics = () => {
  const { userHealthProfile, recommendedIntake } = useUserStore();

  // For the bar chart
  // maxValue should update. should be at about recommendedamount + 400, but then gradually go higher if user goes above
  const currentWaterIntake = 1200;
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

  const customDataPoint = () => {
    return (
      <View
        style={{
          width: 20,
          height: 20,
          backgroundColor: "white",
          borderWidth: 4,
          borderRadius: 10,
          borderColor: "#07BAD1",
        }}
      />
    );
  };
  const customLabel = (val: any) => {
    return (
      <View style={{ width: 70, marginLeft: 7 }}>
        <Text style={{ color: "white", fontWeight: "bold" }}>{val}</Text>
      </View>
    );
  };

  const lineData = [
    { value: 0, label: "0" },
    { value: 0, hideDataPoint: true },
    { value: 0, hideDataPoint: true },
    { value: 0, hideDataPoint: true },
    { value: 0, hideDataPoint: true },
    { value: 0, hideDataPoint: true },
    { value: 250, hideDataPoint: true },
    { value: 450, hideDataPoint: true },
    { value: 600, hideDataPoint: true },
    { value: 600, hideDataPoint: true },
    { value: 1200, hideDataPoint: true },
    { value: 1750, hideDataPoint: true },
    { value: 2000, hideDataPoint: true },
    { value: 2100, hideDataPoint: true },
    { value: 2300, hideDataPoint: true },
    { value: 2400, hideDataPoint: true },
    { value: 2550, hideDataPoint: true },
    { value: 2750, hideDataPoint: true },
    {
      value: 2800,
    },
    { value: 2850, hideDataPoint: true },
    { value: 2950, hideDataPoint: true },
    { value: 3000, hideDataPoint: true },
    { value: 3100, hideDataPoint: true },
    { value: 3150, hideDataPoint: true },
    {
      value: 3150,
      hideDataPoint: true,
      label: "24:00",
      dataPointText: "3.15L",
    },
  ];

  // For the streak progress circle
  const strokeWidth = scale(7);
  const size = scale(65);
  const progress = currentWaterIntake / waterGoal;
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  // Add extra padding to prevent clipping (stroke extends outside the radius)
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [progress]);
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
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
            isAnimated
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

        <View>
          <View>
            <Text className="text-white text-md font-poppins-medium">
              Streak
            </Text>
            <Text className="text-white font-poppins text-sm mb-3">
              Drink {Math.round((waterGoal - currentWaterIntake) / 50) * 50}ml
              more water to reach your daily recommended intake!
            </Text>
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: size,
                height: size,
              }}
            >
              <Svg
                width={size}
                height={size}
                style={{ position: "absolute", left: 0, top: 0 }}
              >
                {/* Background circle */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={darkColors.secondary}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Animated progress circle */}
                <AnimatedCircle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={constantColors.orange}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${circumference}, ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${size / 2}, ${size / 2}`}
                />
              </Svg>
              <AppIcons.fire size={scale(30)} />
            </View>
          </View>
        </View>

        <View className="flex flex-col bg-dark-secondary px-5 py-4 gap-3 rounded-xl">
          <View className="flex-row gap-2 items-center mb-2">
            {/* <AppIcons.dropletFilled
              size={scale(17)}
              color={constantColors.accent}
            /> */}
            <Text className="font-poppins-medium text-md text-white">
              {/* {(waterGoal / 1000).toFixed(1) + "L"} */}
              Today
            </Text>
          </View>
          <LineChart
            data={lineData}
            height={scale(120)}
            spacing={scale(12)}
            initialSpacing={0}
            // disableScroll
            thickness1={scale(4)}
            hideYAxisText
            hideAxesAndRules
            color1={constantColors.accent}
            textColor1="white"
            // hideDataPoints
            dataPointsHeight={6}
            dataPointsWidth={6}
            dataPointsColor1={constantColors.accent}
            textShiftY={-2}
            textShiftX={-5}
            textFontSize={10}
          />
        </View>
      </ScrollView>
    </ScreenBackgroundWrapper>
  );
};

export default Statistics;
