import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';
import { dailySummariesAPI, waterIntakeAPI } from '../services/appwriteService';
import { DailySummariesOfflineService } from '../services/dailySummariesOfflineService';
import type { DailySummariesCache, WaterHistory } from '../services/storage';
import { clearOldDailySummaries, getDailySummariesRange, getWaterHistory, saveDailySummaries, saveWaterHistory } from '../services/storage';
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

export interface DailyDataPoint {
  date: string; // YYYY-MM-DD
  value: number;
  dayLabel: string; // Mo, Tu, We, etc.
  dayOfWeek: number; // 0-6
}

export interface WeekData {
  weekIndex: number; // 0 = current week, 1 = last week, etc.
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: WeeklyDataPoint[];
}

export interface StreakData {
  currentStreak: number;
  todayProgress: number;
  remainingToGoal: number;
}

export interface StatisticsData {
  hourlyData: HourlyDataPoint[];
  weeklyData: WeeklyDataPoint[]; // Legacy - current week only
  weeks: WeekData[]; // NEW - multiple weeks
  allDays: DailyDataPoint[]; // All days since account creation
  streakData: StreakData;
  currentWaterIntake: number;
  todayLogs: { amount: number; timestamp: string }[];
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMoreDays: () => Promise<void>;
  hasMoreDays: boolean;
  accountCreatedAt: string | null;
}

/**
 * Hook to fetch and process statistics data for the statistics page
 * Handles online/offline data fetching with automatic fallback
 */
export const useStatisticsData = (): StatisticsData => {
  const { authUser, recommendedIntake, userHealthProfile } = useUserStore();
  const [hourlyData, setHourlyData] = useState<HourlyDataPoint[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [allDays, setAllDays] = useState<DailyDataPoint[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    todayProgress: 0,
    remainingToGoal: 0,
  });
  const [currentWaterIntake, setCurrentWaterIntake] = useState(0);
  const [todayLogs, setTodayLogs] = useState<{ amount: number; timestamp: string }[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedDaysCount, setLoadedDaysCount] = useState(14); // Start with 14 days (2 weeks)
  const [hasMoreDays, setHasMoreDays] = useState(true);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);

  const waterGoal = userHealthProfile?.customWaterGoal || recommendedIntake || 2400;
  
  // Throttling for storage updates
  const storageUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStorageUpdateRef = useRef<{
    summaries?: DailySummariesCache;
    waterHistory?: WaterHistory;
  } | null>(null);
  
  // Offline service instance
  const offlineServiceRef = useRef<DailySummariesOfflineService>(new DailySummariesOfflineService());

  /**
   * Throttled storage update - batches updates and executes after delay
   * Ensures updates eventually happen but prevents excessive writes
   */
  const scheduleStorageUpdate = async (updates: {
    summaries?: DailySummariesCache;
    waterHistory?: WaterHistory;
  }) => {
    // Merge with pending updates
    if (!pendingStorageUpdateRef.current) {
      pendingStorageUpdateRef.current = {};
    }
    
    if (updates.summaries) {
      pendingStorageUpdateRef.current.summaries = {
        ...pendingStorageUpdateRef.current.summaries,
        ...updates.summaries,
      };
    }
    
    if (updates.waterHistory) {
      pendingStorageUpdateRef.current.waterHistory = {
        ...pendingStorageUpdateRef.current.waterHistory,
        ...updates.waterHistory,
      };
    }
    
    // Clear existing timeout
    if (storageUpdateTimeoutRef.current) {
      clearTimeout(storageUpdateTimeoutRef.current);
    }
    
    // Schedule new update (throttled by 2 seconds)
    storageUpdateTimeoutRef.current = setTimeout(async () => {
      const toUpdate = pendingStorageUpdateRef.current;
      pendingStorageUpdateRef.current = null;
      
      if (!toUpdate) return;
      
      try {
        if (toUpdate.summaries) {
          await saveDailySummaries(toUpdate.summaries);
        }
        
        if (toUpdate.waterHistory) {
          await saveWaterHistory(toUpdate.waterHistory);
        }
      } catch (error) {
        console.error('Error saving to local storage:', error);
      }
    }, 2000); // 2 second throttle
  };

  /**
   * Check if a date has pending offline edits that should not be overwritten
   */
  const hasOfflineEditsForDate = async (date: string): Promise<boolean> => {
    const queue = await offlineServiceRef.current.getOfflineQueue();
    return queue.some(item => item.date === date);
  };

  /**
   * Get account creation date from authUser
   */
  const getAccountCreationDate = (): Date => {
    if (authUser?.$createdAt) {
      return new Date(authUser.$createdAt);
    }
    // Fallback to a very old date if not available
    return new Date('2020-01-01');
  };

  /**
   * Calculate week start and end dates based on current day
   * Week ends on current day and starts 6 days before
   */
  const getWeekDates = (weekOffset: number = 0): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    // Move back by weekOffset weeks (7 days per week)
    endDate.setDate(endDate.getDate() - (weekOffset * 7));
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    
    return { startDate, endDate };
  };

  /**
   * Fetch water data for multiple weeks
   */
  const fetchMultipleWeeksData = async (numWeeks: number): Promise<{ date: string; amount: number; timestamp: string }[]> => {
    if (!authUser?.$id) return [];

    const accountCreation = getAccountCreationDate();
    const { startDate: currentWeekStart } = getWeekDates(0);
    const { startDate: oldestWeekStart } = getWeekDates(numWeeks - 1);
    
    // Don't fetch data before account creation
    const fetchStartDate = oldestWeekStart < accountCreation ? accountCreation : oldestWeekStart;
    const fetchEndDate = new Date();
    fetchEndDate.setHours(23, 59, 59, 999); // Ensure we include the full current day

    try {
      // Try to fetch daily summaries from cloud
      const summaries = await dailySummariesAPI.getDateRange(authUser.$id, fetchStartDate, fetchEndDate);
      
      // Save fetched summaries to local storage (preserving offline edits)
      const summariesToCache: DailySummariesCache = {};
      for (const summary of summaries) {
        const summaryDate = new Date(summary.date);
        const dateKey = summaryDate.toISOString();
        
        // Check if this date has pending offline edits
        const hasOfflineEdits = await hasOfflineEditsForDate(dateKey);
        
        if (!hasOfflineEdits) {
          // Safe to cache - no offline edits pending
          summariesToCache[dateKey] = {
            userId: authUser.$id,
            date: dateKey,
            totalIntake: summary.totalIntake,
            goalAmount: summary.goalAmount,
            numberOfDrinks: summary.numberOfDrinks,
            firstDrink: summary.firstDrink,
            lastDrink: summary.lastDrink,
            updatedAt: summary.updatedAt || new Date().toISOString(),
            $id: summary.$id,
          };
        } else {

        }
      }
      
      // Schedule throttled storage update
      if (Object.keys(summariesToCache).length > 0) {
        scheduleStorageUpdate({ summaries: summariesToCache });
      }
      
      // Convert summaries to expected format
      const result: { date: string; amount: number; timestamp: string }[] = [];
      
      // Create a map of dates with summaries
      const summaryMap = new Map();
      summaries.forEach(summary => {
        // Convert UTC timestamp to local date
        const summaryDate = new Date(summary.date);
        const year = summaryDate.getFullYear();
        const month = String(summaryDate.getMonth() + 1).padStart(2, '0');
        const day = String(summaryDate.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        summaryMap.set(localDateStr, summary);
      });
      
      // Generate all dates in range including today
      const currentDate = new Date(fetchStartDate);
      currentDate.setHours(0, 0, 0, 0);
      const endDateCheck = new Date(fetchEndDate);
      endDateCheck.setHours(0, 0, 0, 0);
      
      while (currentDate <= endDateCheck) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const localMidnight = new Date(year, currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
        const midnight = localMidnight.toISOString();
        
        if (summaryMap.has(dateStr)) {
          const summary = summaryMap.get(dateStr);
          result.push({
            date: dateStr,
            amount: summary.totalIntake,
            timestamp: summary.lastDrink || summary.updatedAt,
          });
        } else if (currentDate >= accountCreation) {
          // Show zero for days after account creation with no data
          result.push({
            date: dateStr,
            amount: 0,
            timestamp: midnight,
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    } catch (error) {
      console.error('Could not fetch from cloud, using local storage', error);
      
      // Fallback to local storage
      const startDateStr = fetchStartDate.toISOString().split('T')[0];
      const endDateStr = fetchEndDate.toISOString().split('T')[0];
      
      // Try cached summaries
      const cachedSummaries = await getDailySummariesRange(authUser.$id, startDateStr, endDateStr);
      
      if (cachedSummaries.length > 0) {
        return cachedSummaries.map(summary => {
          // Convert UTC timestamp to local date
          const summaryDate = new Date(summary.date);
          const year = summaryDate.getFullYear();
          const month = String(summaryDate.getMonth() + 1).padStart(2, '0');
          const day = String(summaryDate.getDate()).padStart(2, '0');
          const displayDate = `${year}-${month}-${day}`;
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

      const currentDate = new Date(fetchStartDate);
      while (currentDate <= fetchEndDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const entries = history[dateStr] || [];
        
        const dailyTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
        
        if (dailyTotal > 0 || entries.length > 0 || currentDate >= accountCreation) {
          result.push({
            date: dateStr,
            amount: dailyTotal,
            timestamp: entries[0] ? new Date(entries[0].timestamp).toISOString() : currentDate.toISOString(),
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    }
  };

  /**   * Fetch today's water intake data (hourly breakdown)
   */
  const fetchTodayData = async (): Promise<{ amount: number; timestamp: string }[]> => {
    if (!authUser?.$id) return [];

    try {
      // Try online first
      const logs = await waterIntakeAPI.getToday(authUser.$id);
      
      // Save to local water history
      const today = new Date().toISOString().split('T')[0];
      const hasOfflineEdits = await hasOfflineEditsForDate(new Date().toISOString());
      
      if (!hasOfflineEdits && logs.length > 0) {
        const waterHistory = await getWaterHistory();
        waterHistory[today] = logs.map(log => ({
          amount: log.amount,
          timestamp: log.timestamp,
          userId: authUser.$id,
          $id: log.$id,
        }));
        
        // Schedule throttled storage update
        scheduleStorageUpdate({ waterHistory });
      }
      
      return logs.map(log => ({
        amount: log.amount,
        timestamp: log.timestamp,
      }));
    } catch (error) {
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
            console.error('Could not verify summary:', err)
          );
          
          result.push({
            date: dateStr,
            amount: summary.totalIntake,
            timestamp: summary.lastDrink || summary.updatedAt,
          });
        } else {
          // No summary - fetch individual logs as fallback
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
              console.error('Could not create summary:', err)
            );
          }
          // If no logs either, the day will show as 0 (not added to result)
        }
      }
      
      return result;
      
    } catch (error) {
      
      // Fallback to local storage
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Try to get summaries from cache first
      const cachedSummaries = await getDailySummariesRange(authUser.$id, startDateStr, endDateStr);
      
      if (cachedSummaries.length > 0) {
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
   * Process all days data - returns only days since account creation
   */
  const processAllDays = (logs: { date: string; amount: number }[], numDays: number): DailyDataPoint[] => {
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const allDaysData: DailyDataPoint[] = [];
    const accountCreation = getAccountCreationDate();

    // Create a map for quick lookup
    const logsMap = new Map<string, number>();
    logs.forEach(log => {
      logsMap.set(log.date, log.amount);
    });

    // Generate days from account creation to today
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const startDate = new Date(accountCreation);
    startDate.setHours(0, 0, 0, 0);
    
    const currentDate = new Date(startDate);
    
    // Only process days from account creation to today
    while (currentDate <= today) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = currentDate.getDay();

      const dailyTotal = logsMap.get(dateStr) || 0;

      allDaysData.push({
        date: dateStr,
        value: dailyTotal,
        dayLabel: daysOfWeek[dayOfWeek],
        dayOfWeek: dayOfWeek,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Check if we've reached account creation
    if (allDaysData.length > 0) {
      const oldestDate = new Date(allDaysData[0].date);
      if (oldestDate <= accountCreation) {
        setHasMoreDays(false);
      }
    }

    return allDaysData;
  };

  /**
   * Process multiple weeks data
   */
  const processMultipleWeeks = (logs: { date: string; amount: number }[], numWeeks: number): WeekData[] => {
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const weeks: WeekData[] = [];
    const accountCreation = getAccountCreationDate();

    // Create a map for quick lookup
    const logsMap = new Map<string, number>();
    logs.forEach(log => {
      logsMap.set(log.date, log.amount);
    });

    // Process each week
    for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
      const { startDate, endDate } = getWeekDates(weekIndex);
      
      // Check if this week is before account creation
      if (endDate < accountCreation) {
        // Stop processing older weeks
        setHasMoreDays(false);
        break;
      }

      const days: WeeklyDataPoint[] = [];

      // Process each day in the week
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayOffset);
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const dayOfWeek = date.getDay();

        // Get amount for this day (0 if no data or before account creation)
        let dailyTotal = 0;
        if (date >= accountCreation) {
          dailyTotal = logsMap.get(dateStr) || 0;
        }

        days.push({
          value: dailyTotal,
          label: daysOfWeek[dayOfWeek],
        });
      }

      const startYear = startDate.getFullYear();
      const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
      const startDay = String(startDate.getDate()).padStart(2, '0');
      const endYear = endDate.getFullYear();
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(endDate.getDate()).padStart(2, '0');

      weeks.push({
        weekIndex,
        startDate: `${startYear}-${startMonth}-${startDay}`,
        endDate: `${endYear}-${endMonth}-${endDay}`,
        days,
      });
    }

    // Check if we can load more weeks
    const oldestWeek = weeks[weeks.length - 1];
    if (oldestWeek) {
      const oldestDate = new Date(oldestWeek.startDate);
      if (oldestDate <= accountCreation) {
        setHasMoreDays(false);
      }
    }

    return weeks;
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
      // Set account creation date
      const accountDate = getAccountCreationDate();
      setAccountCreatedAt(accountDate.toISOString());

      // Check network status
      const netState = await NetInfo.fetch();
      setIsOnline(netState.isConnected && netState.isInternetReachable || false);
      
      // Clean up old cached data (keep 30 days)
      if (netState.isConnected && netState.isInternetReachable) {
        clearOldDailySummaries(30).catch(err => 
          console.warn('Failed to clear old summaries:', err)
        );
      }

      // Calculate how many days since account creation
      const today = new Date();
      const daysSinceCreation = Math.ceil((today.getTime() - accountDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysToLoad = Math.max(loadedDaysCount, daysSinceCreation + 1); // Include today

      // Fetch data in parallel
      const [todayLogs, allDaysLogs] = await Promise.all([
        fetchTodayData(),
        fetchMultipleWeeksData(Math.ceil(daysToLoad / 7)), // Convert days to weeks for fetching
      ]);

      
      // Log today's data specifically
      const todayStr = new Date().toISOString().split('T')[0];
      const todayData = allDaysLogs.find(log => log.date.startsWith(todayStr.substring(0, 10)));

      // Process data
      const processedHourlyData = processHourlyData(todayLogs);
      const processedWeeklyData = processWeeklyData(
        allDaysLogs.map(log => ({ date: log.date, amount: log.amount }))
      );
      const processedAllDays = processAllDays(
        allDaysLogs.map(log => ({ date: log.date, amount: log.amount })),
        daysToLoad
      );
      
      const todayProcessed = processedAllDays[processedAllDays.length - 1];
      
      const processedWeeks = processMultipleWeeks(
        allDaysLogs.map(log => ({ date: log.date, amount: log.amount })),
        Math.ceil(daysToLoad / 7)
      );
      const processedStreakData = calculateStreakData(
        allDaysLogs.map(log => ({ date: log.date, amount: log.amount }))
      );

      // Calculate current water intake
      const currentHour = new Date().getHours();
      const currentIntake = processedHourlyData[currentHour]?.value || 0;

      // Update state
      setHourlyData(processedHourlyData);
      setWeeklyData(processedWeeklyData);
      setAllDays(processedAllDays);
      setWeeks(processedWeeks);
      setStreakData(processedStreakData);
      setCurrentWaterIntake(currentIntake);
      setTodayLogs(todayLogs);
    } catch (err) {
      console.error('Error fetching statistics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load more days (called when user scrolls to oldest days)
   */
  const loadMoreDays = async () => {
    if (!authUser?.$id || !hasMoreDays) return;

    try {
      const newDaysCount = loadedDaysCount + 14; // Load 14 more days (2 weeks)
      const allDaysLogs = await fetchMultipleWeeksData(Math.ceil(newDaysCount / 7));
      
      const processedAllDays = processAllDays(
        allDaysLogs.map(log => ({ date: log.date, amount: log.amount })),
        newDaysCount
      );

      setAllDays(processedAllDays);
      setLoadedDaysCount(newDaysCount);
    } catch (err) {
      console.error('Error loading more days:', err);
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
        fetchData();
      }
    });

    return () => unsubscribe();
  }, [isOnline]);
  
  // Cleanup: Ensure pending storage updates are flushed on unmount
  useEffect(() => {
    return () => {
      if (storageUpdateTimeoutRef.current) {
        clearTimeout(storageUpdateTimeoutRef.current);
        // Execute immediately on unmount
        if (pendingStorageUpdateRef.current) {
          const toUpdate = pendingStorageUpdateRef.current;
          if (toUpdate.summaries) {
            saveDailySummaries(toUpdate.summaries).catch(console.error);
          }
          if (toUpdate.waterHistory) {
            saveWaterHistory(toUpdate.waterHistory).catch(console.error);
          }
        }
      }
    };
  }, []);

  return {
    hourlyData,
    weeklyData,
    weeks,
    allDays,
    streakData,
    currentWaterIntake,
    todayLogs,
    isOnline,
    isLoading,
    error,
    refresh: fetchData,
    loadMoreDays,
    hasMoreDays,
    accountCreatedAt,
  };
};
