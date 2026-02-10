import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { useTheme } from "@/components/ThemeContext";
import { constantColors } from "@/constants/colors";
import { AppIcons } from "@/constants/icon";
import { useStatisticsData } from "@/hooks/useStatisticsData";
import { useUserStore } from "@/hooks/useUserStore";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
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
  const { colors } = useTheme();
  const { healthProfile, recommendedIntake } = useUserStore();
  const {
    hourlyData: rawHourlyData,
    weeklyData: rawWeeklyData,
    streakData,
    currentWaterIntake,
    todayLogs,
    isOnline,
    isLoading,
    error,
    refresh,
  } = useStatisticsData();

  const { isDark } = useTheme();

  const [refreshing, setRefreshing] = React.useState(false);

  const waterGoal = healthProfile?.customWaterGoal || recommendedIntake || 2400;
  const currentHour = new Date().getHours();

  // Calculate adaptive maxValue for weekly chart (baseline: waterGoal, add 20% padding)
  const maxWeeklyValue = Math.max(
    ...rawWeeklyData.map((d) => d.value),
    waterGoal,
  );
  const weeklyChartMax = Math.ceil((maxWeeklyValue * 1.2) / 500) * 500; // Round up to nearest 500

  // Calculate adaptive maxValue for hourly chart (baseline: waterGoal, add 20% padding)
  const maxHourlyValue = Math.max(
    ...rawHourlyData.map((d) => d.value),
    waterGoal,
  );
  const hourlyChartMax = Math.ceil((maxHourlyValue * 1.2) / 500) * 500 - 1000; // Round up to nearest 500

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Process weekly data for bar chart with styling
  const barData: BarDataItem[] = rawWeeklyData.map((dailyLog) => {
    const isGoalReached = dailyLog.value > waterGoal;
    return {
      ...dailyLog,
      frontColor: isGoalReached
        ? constantColors.accent
        : isDark
          ? "lightgray"
          : "darkgray",
      topLabelComponent: () => (
        <View
          style={{
            marginBottom: scale(4),
            alignItems: "center",
            width: scale(28),
          }}
        >
          <Text
            style={{
              color: isGoalReached ? colors.primary : constantColors.accent,
              fontSize: scale(12),
              fontWeight: "bold",
            }}
          >
            {(dailyLog.value / 1000).toFixed(1)}
          </Text>
        </View>
      ),
    };
  });

  // Process hourly data for line chart with styling
  const lineData = rawHourlyData.map((point, hour) => {
    const isCurrentHour = hour === currentHour;
    return {
      ...point,
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
      }),
    };
  });

  // For the streak progress circle
  const strokeWidth = scale(7);
  const size = scale(65);
  const progress = Math.min(1, currentWaterIntake / waterGoal);
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
      {/* Offline Indicator */}
      {!isOnline && (
        <View
          style={{
            backgroundColor: constantColors.accent,
            paddingVertical: scale(8),
            paddingHorizontal: scale(16),
            alignItems: "center",
            marginTop: scale(10),
            marginHorizontal: scale(20),
            borderRadius: scale(8),
          }}
        >
          <Text
            style={{ color: "white", fontSize: scale(12), fontWeight: "600" }}
          >
            Offline - Showing locally stored data
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View
          style={{
            backgroundColor: "#ff4444",
            paddingVertical: scale(8),
            paddingHorizontal: scale(16),
            alignItems: "center",
            marginTop: scale(10),
            marginHorizontal: scale(20),
            borderRadius: scale(8),
          }}
        >
          <Text style={{ color: "white", fontSize: scale(12) }}>{error}</Text>
        </View>
      )}

      {/* Loading State */}
      {isLoading && (
        <View style={{ padding: scale(20), alignItems: "center" }}>
          <ActivityIndicator size="large" color={constantColors.accent} />
          <Text
            style={{
              color: colors.primary,
              marginTop: scale(10),
              fontSize: scale(12),
            }}
          >
            Loading statistics...
          </Text>
        </View>
      )}

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={constantColors.accent}
            colors={[constantColors.accent]}
          />
        }
      >
        <View className="mt-10 flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 py-4 gap-3 rounded-xl">
          <View className="flex-row gap-2 items-center mb-2">
            <AppIcons.dropletFilled
              size={scale(17)}
              color={constantColors.accent}
            />
            <Text className="font-poppins-medium text-md text-light-primary dark:text-dark-primary">
              {(waterGoal / 1000).toFixed(1) + "L"}
            </Text>
          </View>

          <BarChart
            barWidth={scale(28)}
            maxValue={weeklyChartMax}
            stepValue={weeklyChartMax}
            noOfSections={1}
            initialSpacing={0}
            endSpacing={0}
            spacing={scale(11)}
            hideRules
            isAnimated
            xAxisLabelTextStyle={{ color: colors.primary, fontSize: scale(12) }}
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
            <Text className="text-light-primary dark:text-dark-primary text-md font-poppins-medium">
              Streak: {streakData.currentStreak}{" "}
              {streakData.currentStreak === 1 ? "day" : "days"} 🔥
            </Text>
            <Text className="text-light-primary dark:text-dark-primary font-poppins text-sm mb-3">
              {streakData.remainingToGoal > 0
                ? `Drink ${Math.round(streakData.remainingToGoal / 50) * 50}ml more water to reach your daily goal!`
                : "🎉 Goal reached! Keep it up!"}
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
                  stroke={colors.secondary}
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

        <View className="flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 py-4 gap-3 rounded-xl">
          <View className="flex-row gap-2 items-center mb-2">
            <Text className="font-poppins-medium text-md text-light-primary dark:text-dark-primary">
              Today
            </Text>
          </View>
          <View>
            <LineChart
              height={scale(160)}
              thickness={scale(4)}
              color={constantColors.accent}
              maxValue={hourlyChartMax}
              noOfSections={3}
              areaChart
              yAxisTextStyle={{
                color: isDark ? "lightgray" : "gray",
                fontSize: scale(10),
              }}
              xAxisLabelTextStyle={{
                color: colors.primary,
                fontSize: scale(10),
                width: scale(30),
              }}
              data={lineData}
              curved
              curveType={1}
              curvature={0.2}
              startFillColor={constantColors.accent}
              endFillColor={constantColors.accent}
              startOpacity={0.4}
              endOpacity={0.1}
              spacing={scale(10)}
              rulesColor="gray"
              rulesType="solid"
              initialSpacing={5}
              endSpacing={scale(8)}
              yAxisColor={isDark ? "lightgray" : "gray"}
              xAxisColor={isDark ? "lightgray" : "gray"}
              dataPointsHeight={scale(12)}
              dataPointsWidth={scale(12)}
              dataPointsColor={constantColors.accent}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                color: "gray",
                fontSize: scale(12),
                marginTop: scale(8),
                textAlign: "center",
                fontFamily: "Poppins-Regular",
                paddingHorizontal: scale(4),
              }}
            >
              {todayLogs.length} drink{todayLogs.length !== 1 ? "s" : ""} •{" "}
              Total: {(currentWaterIntake / 1000).toFixed(2)}L
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenBackgroundWrapper>
  );
};

export default Statistics;
