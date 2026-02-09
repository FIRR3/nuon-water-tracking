import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { dailySummariesAPI, waterIntakeAPI } from '../services/appwriteService';
import { getDailySummariesRange, getWaterHistory } from '../services/storage';
import { verifyAndFixDailySummary } from '../utils/dailySummaryMaintenance';
import { useUserStore } from './useUserStore';

export interface HourlyDataPoint {
  value: number;
  label: string;
  hideDataPoint: boolean;
  customDataPoint?: () => React.ReactElement;
  dataPointLabelComponent?: () => React.ReactElement;
  dataPointLabelShiftY?: number;
  dataPointLabelShiftX?: number;
}

export interface WeeklyDataPoint {
  value: number;
  label: string;
  frontColor?: string;
  topLabelComponent?: () => React.ReactElement;
}

export interface StreakData {
  currentStreak: number;
  todayProgress: number;
  remainingToGoal: number;
}

export interface StatisticsData {
  hourlyData: HourlyDataPoint[];
  weeklyData: WeeklyDataPoint[];
  streakData: StreakData;
  currentWaterIntake: number;
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and process statistics data for the statistics page
 * Handles online/offline data fetching with automatic fallback
 */
export const useStatisticsData = (): StatisticsData => {
  const { authUser, recommendedIntake, userHealthProfile } = useUserStore();
  const [hourlyData, setHourlyData] = useState<HourlyDataPoint[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    todayProgress: 0,
    remainingToGoal: 0,
  });
  const [currentWaterIntake, setCurrentWaterIntake] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const waterGoal = userHealthProfile?.customWaterGoal || recommendedIntake || 2400;

  /**
   * Fetch today's water intake data (hourly breakdown)
   */
  const fetchTodayData = async (): Promise<{ amount: number; timestamp: string }[]> => {
    if (!authUser?.$id) return [];

    try {
      // Try online first
      const logs = await waterIntakeAPI.getToday(authUser.$id);
      console.log('Fetched today data from cloud:', logs.length, 'entries');
      return logs.map(log => ({
        amount: log.amount,
        timestamp: log.timestamp,
      }));
    } catch (error) {
      console.log('Could not fetch today data from cloud, using local storage');
      // Fallback to local storage
      const history = await getWaterHistory();
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = history[today] || [];
      return todayEntries.map(entry => ({
        amount: entry.amount,
        timestamp: new Date(entry.timestamp).toISOString(),
      }));
    }
  };

  /**
   * Fetch last 7 days of water intake data
   * PRIORITY: Use daily summaries, fallback to individual logs if no summary exists
   */
  const fetchWeeklyData = async (): Promise<{ date: string; amount: number; timestamp: string }[]> => {
    if (!authUser?.$id) return [];

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
    startDate.setHours(0, 0, 0, 0);

    try {
      // Try to fetch daily summaries from cloud (MUCH faster!)
      const summaries = await dailySummariesAPI.getDateRange(authUser.$id, startDate, endDate);
      console.log('✅ Fetched', summaries.length, 'daily summaries from cloud');
      
      // Convert summaries to expected format
      const result: { date: string; amount: number; timestamp: string }[] = [];
      
      // Create a map of dates with summaries
      const summaryMap = new Map();
      summaries.forEach(summary => {
        // Convert UTC date to local date string
        const summaryDate = new Date(summary.date);
        const year = summaryDate.getFullYear();
        const month = String(summaryDate.getMonth() + 1).padStart(2, '0');
        const day = String(summaryDate.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        summaryMap.set(localDateStr, summary);
      });
      
      // For each day in the range
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        // Use local date string
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // For midnight ISO string, create a UTC date from local date components
        const localMidnight = new Date(year, date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const midnight = localMidnight.toISOString();
        
        if (summaryMap.has(dateStr)) {
          // Have summary - verify it matches logs
          const summary = summaryMap.get(dateStr);
          
          // Verify summary matches logs (asynchronously in background)
          const currentGoal = userHealthProfile?.customWaterGoal || recommendedIntake || 2400;
          verifyAndFixDailySummary(authUser.$id, midnight, currentGoal).catch(err => 
            console.log('Could not verify summary:', err)
          );
          
          result.push({
            date: dateStr,
            amount: summary.totalIntake,
            timestamp: summary.lastDrink || summary.updatedAt,
          });
        } else {
          // No summary - fetch individual logs as fallback
          console.log('⚠️ No summary for', dateStr, '- fetching logs');
          const logs = await waterIntakeAPI.getDateRange(authUser.$id, localMidnight, localMidnight);
          const dailyTotal = logs.reduce((sum, log) => sum + log.amount, 0);
          
          if (dailyTotal > 0 || logs.length > 0) {
            // Has logs - use them and create summary
            result.push({
              date: dateStr,
              amount: dailyTotal,
              timestamp: logs[0]?.timestamp || date.toISOString(),
            });
            
            // Create summary for this day (asynchronously in background)
            const currentGoal = userHealthProfile?.customWaterGoal || recommendedIntake || 2400;
            verifyAndFixDailySummary(authUser.$id, midnight, currentGoal).catch(err =>
              console.log('Could not create summary:', err)
            );
          }
          // If no logs either, the day will show as 0 (not added to result)
        }
      }
      
      return result;
      
    } catch (error) {
      console.log('Could not fetch from cloud, using local storage');
      
      // Fallback to local storage
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Try to get summaries from cache first
      const cachedSummaries = await getDailySummariesRange(authUser.$id, startDateStr, endDateStr);
      
      if (cachedSummaries.length > 0) {
        console.log('✅ Using', cachedSummaries.length, 'cached summaries');
        return cachedSummaries.map(summary => {
          // Extract YYYY-MM-DD from datetime for display
          const displayDate = new Date(summary.date).toISOString().split('T')[0];
          return {
            date: displayDate,
            amount: summary.totalIntake,
            timestamp: summary.lastDrink || summary.updatedAt,
          };
        });
      }
      
      // Final fallback: local history
      const history = await getWaterHistory();
      const result: { date: string; amount: number; timestamp: string }[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        // Use local date string
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const entries = history[dateStr] || [];
        
        const dailyTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
        
        if (dailyTotal > 0 || entries.length > 0) {
          result.push({
            date: dateStr,
            amount: dailyTotal,
            timestamp: entries[0] ? new Date(entries[0].timestamp).toISOString() : date.toISOString(),
          });
        }
      }

      return result;
    }
  };

  /**
   * Process hourly data for line chart (24 hours)
   */
  const processHourlyData = (logs: { amount: number; timestamp: string }[]): HourlyDataPoint[] => {
    const currentHour = new Date().getHours();
    
    // Initialize hourly totals (cumulative)
    const hourlyTotals: { [hour: number]: number } = {};
    for (let i = 0; i < 24; i++) {
      hourlyTotals[i] = 0;
    }

    // Group logs by hour and calculate cumulative totals
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const logHour = logDate.getHours();
      
      // Add to this hour and all subsequent hours (cumulative)
      for (let h = logHour; h < 24; h++) {
        hourlyTotals[h] += log.amount;
      }
    });

    // Generate data points
    return Array.from({ length: 24 }, (_, hour) => {
      const value = hour <= currentHour ? hourlyTotals[hour] : hourlyTotals[currentHour];
      const isCurrentHour = hour === currentHour;
      const isStartTime = hour === 0;
      const isEndTime = hour === 23;
      const showEndTime = isEndTime && currentHour < 21;

      return {
        value: value,
        label: isStartTime
          ? '0:00'
          : isCurrentHour
            ? `${hour}:00`
            : showEndTime
              ? '24:00'
              : '',
        hideDataPoint: !isCurrentHour,
      };
    });
  };

  /**
   * Process weekly data for bar chart (last 7 days)
   */
  const processWeeklyData = (logs: { date: string; amount: number }[]): WeeklyDataPoint[] => {
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const weekData: WeeklyDataPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      // Use local date string instead of UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = date.getDay();

      // Sum all logs for this day
      const dailyTotal = logs
        .filter(log => log.date === dateStr)
        .reduce((sum, log) => sum + log.amount, 0);

      weekData.push({
        value: dailyTotal,
        label: daysOfWeek[dayOfWeek],
      });
    }

    return weekData;
  };

  /**
   * Calculate streak data
   */
  const calculateStreakData = (logs: { date: string; amount: number }[]): StreakData => {
    // Group by date and calculate daily totals
    const dailyTotals: { [date: string]: number } = {};
    logs.forEach(log => {
      if (!dailyTotals[log.date]) {
        dailyTotals[log.date] = 0;
      }
      dailyTotals[log.date] += log.amount;
    });

    // Calculate current streak (consecutive days from today backwards)
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      // Use local date string instead of UTC
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const total = dailyTotals[dateStr] || 0;

      if (total >= waterGoal) {
        streak++;
      } else if (i > 0) {
        // If not today and didn't meet goal, break streak
        break;
      }
      // If today and didn't meet goal yet, continue checking previous days
    }

    // Use local date for today
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const todayTotal = dailyTotals[todayStr] || 0;
    const remaining = Math.max(0, waterGoal - todayTotal);

    return {
      currentStreak: streak,
      todayProgress: todayTotal,
      remainingToGoal: remaining,
    };
  };

  /**
   * Fetch and process all statistics data
   */
  const fetchData = async () => {
    if (!authUser?.$id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check network status
      const netState = await NetInfo.fetch();
      setIsOnline(netState.isConnected && netState.isInternetReachable || false);

      // Fetch data in parallel
      const [todayLogs, weeklyLogs] = await Promise.all([
        fetchTodayData(),
        fetchWeeklyData(),
      ]);

      // Process data
      const processedHourlyData = processHourlyData(todayLogs);
      const processedWeeklyData = processWeeklyData(
        weeklyLogs.map(log => ({ date: log.date, amount: log.amount }))
      );
      const processedStreakData = calculateStreakData(
        weeklyLogs.map(log => ({ date: log.date, amount: log.amount }))
      );

      // Calculate current water intake
      const currentHour = new Date().getHours();
      const currentIntake = processedHourlyData[currentHour]?.value || 0;

      // Update state
      setHourlyData(processedHourlyData);
      setWeeklyData(processedWeeklyData);
      setStreakData(processedStreakData);
      setCurrentWaterIntake(currentIntake);
    } catch (err) {
      console.error('Error fetching statistics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [authUser?.$id, waterGoal]);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected && state.isInternetReachable || false;
      setIsOnline(isNowOnline);

      // Refresh data when coming back online
      if (wasOffline && isNowOnline) {
        console.log('Network restored, refreshing statistics...');
        fetchData();
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  return {
    hourlyData,
    weeklyData,
    streakData,
    currentWaterIntake,
    isOnline,
    isLoading,
    error,
    refresh: fetchData,
  };
};
