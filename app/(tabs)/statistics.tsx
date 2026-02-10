import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { useTheme } from "@/components/ThemeContext";
import { constantColors } from "@/constants/colors";
import { AppIcons } from "@/constants/icon";
import { useStatisticsData } from "@/hooks/useStatisticsData";
import { useUserStore } from "@/hooks/useUserStore";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, Text, View } from "react-native";
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
    allDays,
    streakData,
    currentWaterIntake,
    todayLogs,
    isOnline,
    isLoading,
    error,
    refresh,
    loadMoreDays,
    hasMoreDays,
  } = useStatisticsData();

  const { isDark } = useTheme();

  const [refreshing, setRefreshing] = React.useState(false);
  const [visibleDateRange, setVisibleDateRange] = useState({ start: '', end: '' });
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: screenWidth } = Dimensions.get('window');

  const waterGoal = healthProfile?.customWaterGoal || recommendedIntake || 2400;
  const currentHour = new Date().getHours();

  // Calculate adaptive maxValue for all days
  const maxDailyValue = allDays.length > 0 
    ? Math.max(...allDays.map(d => d.value), waterGoal)
    : waterGoal;
  const chartMax = Math.ceil(maxDailyValue * 1.2 / 500) * 500;
  
  // Calculate bar width based on 7 bars fitting in screen width
  const chartContainerPadding = scale(20) * 2; // paddingHorizontal on outer container
  const chartInnerPadding = scale(20) * 2; // px-5 on inner container = scale(20)
  const totalPadding = chartContainerPadding + chartInnerPadding;
  const availableWidth = screenWidth - totalPadding;
  const barSpacing = scale(11);
  const totalSpacing = barSpacing * 6; // 6 spaces between 7 bars
  const barWidth = (availableWidth - totalSpacing) / 7;
  const barTotalWidth = barWidth + barSpacing; // bar width + spacing
  const snapInterval = barTotalWidth * 7; // Snap every 7 days

  // Calculate average weekly intake for visible 7 days
  const [averageWeeklyIntake, setAverageWeeklyIntake] = useState(0);
  
  useEffect(() => {
    if (visibleDateRange.start && visibleDateRange.end) {
      const visibleDays = allDays.filter(day => 
        day.date >= visibleDateRange.start && day.date <= visibleDateRange.end
      );
      const totalIntake = visibleDays.reduce((sum, day) => sum + day.value, 0);
      const average = visibleDays.length > 0 ? totalIntake / visibleDays.length : 0;
      setAverageWeeklyIntake(average);
    }
  }, [visibleDateRange, allDays]);

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

  // Handle scroll to update date range and load more
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // Calculate first visible day based on scroll position
    const firstVisibleIndex = Math.round(offsetX / barTotalWidth);
    const lastVisibleIndex = Math.min(firstVisibleIndex + 6, allDays.length - 1); // 7 days visible

    if (allDays.length > 0 && firstVisibleIndex >= 0 && lastVisibleIndex < allDays.length) {
      const startDate = allDays[firstVisibleIndex]?.date || '';
      const endDate = allDays[lastVisibleIndex]?.date || '';
      setVisibleDateRange({ start: startDate, end: endDate });
    }

    // Load more when near the start (oldest days)
    if (firstVisibleIndex < 7 && hasMoreDays) {
      loadMoreDays();
    }
  };

  // Format date range for display
  const formatDateRange = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    
    if (startMonth === endMonth) {
      return `${startDay}-${endDay} ${startMonth}`;
    } else {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }
  };
  
  // Initialize visible date range and scroll to current week
  useEffect(() => {
    if (allDays.length > 0) {
      const lastIndex = allDays.length - 1;
      const firstVisibleIndex = Math.max(0, lastIndex - 6);
      setVisibleDateRange({
        start: allDays[firstVisibleIndex]?.date || '',
        end: allDays[lastIndex]?.date || '',
      });
      
      // Scroll to show the last 7 days (current week)
      setTimeout(() => {
        if (scrollViewRef.current && allDays.length > 7) {
          // Calculate scroll position to show last 7 days
          const scrollPosition = (allDays.length - 7) * barTotalWidth;
          scrollViewRef.current.scrollTo({ x: scrollPosition, animated: false });
        }
      }, 100);
    }
  }, [allDays.length]);

  // Prepare bar chart data for all days
  const barData: BarDataItem[] = allDays.map((dailyLog) => {
    const isGoalReached = dailyLog.value >= waterGoal;
    return {
      value: dailyLog.value,
      label: dailyLog.dayLabel,
      frontColor: isGoalReached
        ? constantColors.accent
        : isDark
          ? "lightgray"
          : "darkgray",
      topLabelComponent: () => (
        <View
          style={{
            marginBottom: scale(4),
            alignItems: 'center',
            width: barWidth,
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

      {/* Loading State - Only show when offline to avoid flickering during fast online syncs */}
      {isLoading && !refreshing && !isOnline && (
        <View style={{ padding: scale(20), alignItems: 'center' }}>
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
        {/* Single Scrollable Day Chart */}
        <View className="mt-10">
          <View style={{ paddingHorizontal: scale(20) }}>
            <View className="flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 py-4 gap-3 rounded-xl">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row gap-2 items-center">
                  <AppIcons.dropletFilled
                    size={scale(17)}
                    color={constantColors.accent}
                  />
                  <Text className="font-poppins-medium text-md text-light-primary dark:text-dark-primary">
                    {(averageWeeklyIntake / 1000).toFixed(1) + "L avg"}
                  </Text>
                </View>
                <Text className="font-poppins text-xs text-gray-400">
                  {formatDateRange(visibleDateRange.start, visibleDateRange.end)}
                </Text>
              </View>

              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                snapToInterval={snapInterval}
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingLeft: allDays.length < 7 ? 0 : undefined,
                  paddingRight: allDays.length >= 7 ? 0 : undefined,
                }}
              >
                <BarChart
                  barWidth={barWidth}
                  maxValue={chartMax}
                  stepValue={chartMax}
                  noOfSections={1}
                  initialSpacing={0}
                  endSpacing={0}
                  spacing={scale(10.5)}
                  hideRules
                  isAnimated
                  xAxisLabelTextStyle={{ color: "white", fontSize: scale(12) }}
                  hideYAxisText
                  scrollToEnd
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
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: scale(20) }}>
          <View>
            <Text className="text-light-primary dark:text-dark-primary text-md font-poppins-medium">
              Streak: {streakData.currentStreak} {streakData.currentStreak === 1 ? 'day' : 'days'} 
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

        <View style={{ paddingHorizontal: scale(20) }} className="flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 py-4 gap-3 rounded-xl">
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
