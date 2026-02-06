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

// // 1. Get current hour
// const currentHour = new Date().getHours();

// // 2. Fetch today's water logs from database
// const todayLogs = await waterIntakeAPI.getToday(authUser.$id);

// // 3. Group logs by hour and calculate cumulative totals
// const hourlyIntake = {};
// let cumulative = 0;
// for (let hour = 0; hour < 24; hour++) {
//   const logsInHour = todayLogs.filter(log => {
//     const logHour = new Date(log.timestamp).getHours();
//     return logHour === hour;
//   });
//   cumulative += logsInHour.reduce((sum, log) => sum + log.amount, 0);
//   hourlyIntake[hour] = cumulative;
// }

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

  // Generate 24 hourly data points for today's water intake
  // Mock data: simulate water consumption throughout the day (current time: 18:00)
  const currentHour = 18; // In production, use: new Date().getHours()

  // Mock cumulative water intake per hour (in ml)
  const hourlyIntake = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 250, // Morning: first drink
    7: 450, // Breakfast
    8: 700,
    9: 950,
    10: 1200, // Mid-morning
    11: 1450,
    12: 1750, // Lunch
    13: 2000,
    14: 2200,
    15: 2400,
    16: 2550,
    17: 2700,
    18: 2850, // Current hour - 6pm
    // Future hours (after current time) - no data yet
    19: 2850,
    20: 2850,
    21: 2850,
    22: 2850,
    23: 2850,
  };

  // Generate all 24 hours but keep values flat after current hour
  const lineData = Array.from({ length: 24 }, (_, hour) => {
    const value =
      hour <= currentHour ? hourlyIntake[hour] || 0 : hourlyIntake[currentHour];
    const isCurrentHour = hour === currentHour;
    const isStartTime = hour === 0;
    const isEndTime = hour === 23;
    // Don't show 24:00 if current hour is >= 21 to avoid overlap
    const showEndTime = isEndTime && currentHour < 21;

    return {
      value: value,
      label: isStartTime
        ? "0:00"
        : isCurrentHour
          ? `${hour}:00`
          : showEndTime
            ? "24:00"
            : "",
      hideDataPoint: !isCurrentHour,
      ...(isCurrentHour && {
        customDataPoint: () => (
          <View
            style={{
              width: scale(14),
              height: scale(14),
              backgroundColor: "white",
              borderWidth: scale(3),
              borderRadius: scale(7),
              borderColor: constantColors.accent,
            }}
          />
        ),
        dataPointLabelComponent: () => (
          <View
            style={{
              backgroundColor: "black",
              paddingHorizontal: scale(8),
              paddingVertical: scale(4),
              borderRadius: scale(4),
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: scale(10),
                fontWeight: "bold",
              }}
              numberOfLines={1}
            >
              {(value / 1000).toFixed(1)}L
            </Text>
          </View>
        ),
        dataPointLabelShiftY: scale(-32),
        dataPointLabelShiftX: scale(-22),
      }),
    };
  });

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

  return (
    <ScreenBackgroundWrapper className="">
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingBottom: scale(130),
          display: "flex",
          gap: scale(45),
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
            <Text className="font-poppins-medium text-md text-white">
              Today
            </Text>
          </View>
          <View>
            <LineChart
              height={scale(160)}
              thickness={scale(4)}
              color={constantColors.accent}
              maxValue={3000}
              noOfSections={3}
              areaChart
              yAxisTextStyle={{ color: "lightgray", fontSize: scale(10) }}
              xAxisLabelTextStyle={{
                color: "white",
                fontSize: scale(10),
                width: scale(30),
              }}
              data={lineData}
              curved
              startFillColor={constantColors.accent}
              endFillColor={constantColors.accent}
              startOpacity={0.4}
              endOpacity={0.1}
              spacing={scale(10)}
              rulesColor="gray"
              rulesType="solid"
              initialSpacing={5}
              endSpacing={scale(8)}
              yAxisColor="lightgray"
              xAxisColor="lightgray"
              dataPointsHeight={scale(8)}
              dataPointsWidth={scale(8)}
              dataPointsColor={constantColors.accent}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenBackgroundWrapper>
  );
};

export default Statistics;
