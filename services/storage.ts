import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  WATER_INTAKE: 'water_intake',
  USER_SETTINGS: 'user_settings',
  PERSONAL_DETAILS: 'personal_details',
  WATER_HISTORY: 'water_history',
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
  recommendedWaterIntake: number;
  unit: 'ml' | 'oz';
}

export interface PersonalDetails {
  currentWeight: number;
  height: number;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active';
}

export interface WaterIntakeEntry {
  amount: number;
  timestamp: number;
}

export interface WaterHistory {
  [date: string]: WaterIntakeEntry[];
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
    recommendedWaterIntake: 2400, // Default 2.4L
    unit: 'ml'
  };
};

// Personal details functions
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

export const getTodayWaterIntake = async (): Promise<number> => {
  const history = await getWaterHistory();
  const today = new Date().toISOString().split('T')[0];

  if (!history[today]) return 0;

  return history[today].reduce((total, entry) => total + entry.amount, 0);
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