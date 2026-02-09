import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  WATER_INTAKE: 'water_intake',
  USER_SETTINGS: 'user_settings',
  PERSONAL_DETAILS: 'personal_details',
  WATER_HISTORY: 'water_history',
  USER_PROFILE: 'user_profile',
  HEALTH_PROFILE: 'health_profile',
  DAILY_SUMMARIES: 'daily_summaries',
} as const;

// Generic storage functions
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    throw new Error(`Failed to store data for key ${key}: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue == null) return null;
    const parsed = JSON.parse(jsonValue);
    if (parsed === null || typeof parsed !== 'object') return null;
    return parsed;
  } catch (e) {
    throw new Error(`Error retrieving data for key ${key}: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    throw new Error(`Failed to remove data for key ${key}: ${e instanceof Error ? e.message : String(e)}`);
  }
};

// Specific functions for your app data
export interface UserSettings {
  customWaterGoal: number | null; // Match cloud naming
  unit: 'ml' | 'oz';
}

export interface PersonalDetails {
  weight: number; // kg - match cloud
  height: number; // meters - match cloud
  birthday: string; // ISO string - match cloud
  gender: 'Male' | 'Female' | 'Other';
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active';
}

export interface UserProfile {
  $id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  birthday?: string;
  hasCompletedOnboarding?: boolean;
}

export interface HealthProfile {
  $id: string;
  user: string;
  weight: number;
  height: number;
  gender: 'Male' | 'Female' | 'Other';
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active';
  customWaterGoal: number | null;
}

export interface WaterIntakeEntry {
  amount: number;
  timestamp: number | string; // Can be Unix timestamp (number) or ISO string
  userId?: string; // Optional for backward compatibility
  source?: 'bluetooth' | 'manual'; // Optional for backward compatibility
  localId?: string; // Optional - for offline tracking
  $id?: string; // Optional - cloud document ID when synced
}

export interface WaterHistory {
  [date: string]: WaterIntakeEntry[];
}

export interface DailySummaryLocal {
  userId: string;
  date: string; // ISO datetime string (midnight)
  totalIntake: number; // ml
  goalAmount: number; // ml (always reflects current goal)
  numberOfDrinks: number; // count
  firstDrink: string | null; // ISO datetime string
  lastDrink: string | null; // ISO datetime string
  updatedAt: string; // ISO datetime string
  $id?: string; // Optional - cloud document ID when synced
}

export interface DailySummariesCache {
  [date: string]: DailySummaryLocal; // Keyed by date (YYYY-MM-DD)
}

// Water intake functions
export const saveWaterIntake = async (amount: number): Promise<void> => {
  // No-op: intake is now calculated from history
};

export const getWaterIntake = async (): Promise<number> => {
  return await getTodayWaterIntake();
};

// User settings functions
export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  await storeData(STORAGE_KEYS.USER_SETTINGS, settings);
};

export const getUserSettings = async (): Promise<UserSettings> => {
  const data = await getData<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
  return data || {
    customWaterGoal: null,
    unit: 'ml'
  };
};

// User profile functions
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  await storeData(STORAGE_KEYS.USER_PROFILE, profile);
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  return await getData<UserProfile>(STORAGE_KEYS.USER_PROFILE);
};

// Health profile functions
export const saveHealthProfile = async (profile: HealthProfile): Promise<void> => {
  await storeData(STORAGE_KEYS.HEALTH_PROFILE, profile);
};

export const getHealthProfile = async (): Promise<HealthProfile | null> => {
  return await getData<HealthProfile>(STORAGE_KEYS.HEALTH_PROFILE);
};

// Personal details functions (legacy support)
export const savePersonalDetails = async (details: PersonalDetails): Promise<void> => {
  await storeData(STORAGE_KEYS.PERSONAL_DETAILS, details);
};

export const getPersonalDetails = async (): Promise<PersonalDetails | null> => {
  return await getData<PersonalDetails>(STORAGE_KEYS.PERSONAL_DETAILS);
};

// Water history functions
export const saveWaterHistory = async (history: WaterHistory): Promise<void> => {
  await storeData(STORAGE_KEYS.WATER_HISTORY, history);
};

export const getWaterHistory = async (): Promise<WaterHistory> => {
  const data = await getData<WaterHistory>(STORAGE_KEYS.WATER_HISTORY);
  if (!data || typeof data !== 'object') return {};
  return data;
};

export const addWaterEntry = async (amount: number): Promise<void> => {
  const history = await getWaterHistory();
  const today = new Date().toISOString().split('T')[0];

  if (!history[today]) {
    history[today] = [];
  }

  const entry: WaterIntakeEntry = {
    amount,
    timestamp: Date.now(),
  };

  history[today].push(entry);
  await saveWaterHistory(history);
};

// Daily Summaries functions
export const saveDailySummaries = async (summaries: DailySummariesCache): Promise<void> => {
  await storeData(STORAGE_KEYS.DAILY_SUMMARIES, summaries);
};

export const getDailySummaries = async (): Promise<DailySummariesCache> => {
  const data = await getData<DailySummariesCache>(STORAGE_KEYS.DAILY_SUMMARIES);
  if (!data || typeof data !== 'object') return {};
  return data;
};

export const saveDailySummary = async (userId: string, summary: DailySummaryLocal): Promise<void> => {
  const summaries = await getDailySummaries();
  summaries[summary.date] = summary;
  await saveDailySummaries(summaries);
};

export const getDailySummary = async (userId: string, date: string): Promise<DailySummaryLocal | null> => {
  const summaries = await getDailySummaries();
  return summaries[date] || null;
};

export const getTodaysSummary = async (userId: string): Promise<DailySummaryLocal | null> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  return await getDailySummary(userId, todayStr);
};

export const getDailySummariesRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailySummaryLocal[]> => {
  const summaries = await getDailySummaries();
  const result: DailySummaryLocal[] = [];
  
  // Parse datetime strings for comparison
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  // Get all summaries within date range
  for (const [dateKey, summary] of Object.entries(summaries)) {
    const summaryDate = new Date(summary.date);
    if (summaryDate >= start && summaryDate <= end) {
      result.push(summary);
    }
  }
  
  // Sort by date descending
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return result;
};

export const clearOldDailySummaries = async (daysToKeep: number = 30): Promise<void> => {
  const summaries = await getDailySummaries();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];
  
  const updated: DailySummariesCache = {};
  for (const [date, summary] of Object.entries(summaries)) {
    if (date >= cutoffStr) {
      updated[date] = summary;
    }
  }
  
  await saveDailySummaries(updated);
};

export const getTodayWaterIntake = async (): Promise<number> => {
  const history = await getWaterHistory();
  const today = new Date().toISOString().split('T')[0];

  if (!history[today]) return 0;

  // Handle both old and new entry formats
  return history[today].reduce((total, entry) => {
    // Ensure we have a valid amount
    return total + (typeof entry.amount === 'number' ? entry.amount : 0);
  }, 0);
};

// Clear all data (useful for logout or reset)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (e) {
    throw new Error(`Failed to clear data: ${e instanceof Error ? e.message : String(e)}`);
  }
};

// Add this function to your storage.ts file

export const removeWaterAmount = async (amount: number): Promise<void> => {
  const history = await getWaterHistory();
  const today = new Date().toISOString().split('T')[0];

  if (!history[today] || history[today].length === 0) {
    // No entries to remove from
    return;
  }

  let remainingToRemove = amount;
  const entries = history[today];

  // Remove from the most recent entries first
  for (let i = entries.length - 1; i >= 0 && remainingToRemove > 0; i--) {
    const entry = entries[i];
    
    if (entry.amount <= remainingToRemove) {
      // Remove entire entry
      remainingToRemove -= entry.amount;
      entries.splice(i, 1);
    } else {
      // Partially reduce this entry
      entry.amount -= remainingToRemove;
      remainingToRemove = 0;
    }
  }

  // If no entries left for today, remove the day entry
  if (entries.length === 0) {
    delete history[today];
  } else {
    history[today] = entries;
  }

  await saveWaterHistory(history);
};