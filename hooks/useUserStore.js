// store/useUserStore.js
import { create } from 'zustand';
import {
  authAPI,
  healthProfileAPI,
  userProfileAPI,
  waterIntakeAPI
} from '../services/appwriteService';
import { waterIntakeLogsService } from '../services/waterIntakeLogsService';
import { calculateRecommendedWaterIntake } from '../utils/waterCalculations';

export const useUserStore = create((set, get) => ({
  // State
  authUser: null,
  userProfile: null,
  healthProfile: null,
  recommendedIntake: null,
  todayIntake: [],
  totalToday: 0,
  isLoading: false,
  error: null,
  syncStatus: 'idle', // 'idle', 'syncing', 'synced', 'error'
  pendingSyncCount: 0,

  // Actions
  fetchUserData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth user
      const authUser = await authAPI.getCurrentUser();
      
      // Get user profile
      const userProfile = await userProfileAPI.get(authUser.$id);
      
      // Get health profile
      const healthProfile = await healthProfileAPI.getByUserId(authUser.$id);
      
      // Calculate recommended intake
      let recommendedIntake = null;
      if (healthProfile && userProfile) {
        recommendedIntake = calculateRecommendedWaterIntake({
          weight: healthProfile.weight,
          height: healthProfile.height * 100, // Convert m to cm
          activityLevel: healthProfile.activityLevel,
          age: calculateAge(userProfile.birthday),
          gender: healthProfile.gender,
          customGoal: healthProfile.customWaterGoal
        });
      }
      
      // Get today's intake
      const todayLogs = await waterIntakeAPI.getToday(authUser.$id);
      const totalToday = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      
      // Get pending sync count
      const pendingSyncCount = await waterIntakeLogsService.getPendingCount();
      
      set({
        authUser,
        userProfile,
        healthProfile,
        recommendedIntake,
        todayIntake: todayLogs,
        totalToday,
        pendingSyncCount,
        isLoading: false
      });
      
      // Sync offline queue in background
      waterIntakeLogsService.syncOfflineQueue().then(() => {
        get().refreshTodayIntake();
      });
      
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  updateHealthProfile: async (updates) => {
    const { authUser, healthProfile, userProfile } = get();
    
    try {
      const updated = await healthProfileAPI.updateByUserId(
        authUser.$id,
        updates
      );
      
      // Recalculate recommended intake
      const recommendedIntake = calculateRecommendedWaterIntake({
        weight: updated.weight,
        height: updated.height * 100,
        activityLevel: updated.activityLevel,
        age: calculateAge(userProfile.birthday),
        gender: updated.gender,
        customGoal: updated.customWaterGoal
      });
      
      set({ 
        healthProfile: updated,
        recommendedIntake
      });
      
    } catch (error) {
      console.error('Failed to update health profile:', error);
      throw error;
    }
  },

  addWaterIntake: async (amount, source = 'bluetooth') => {
    const { authUser, todayIntake, totalToday } = get();
    
    if (!authUser) {
      console.error('No authenticated user');
      throw new Error('User not authenticated');
    }
    
    try {
      // Use the new service with offline queue support
      const newLog = await waterIntakeLogsService.addWaterIntake(
        authUser.$id, 
        amount, 
        source
      );
      
      // Update local state immediately for responsiveness
      set({
        todayIntake: [newLog, ...todayIntake],
        totalToday: totalToday + amount
      });
      
      // Update pending count
      const pendingSyncCount = await waterIntakeLogsService.getPendingCount();
      set({ pendingSyncCount });
      
      return newLog;
      
    } catch (error) {
      console.error('Failed to add water intake:', error);
      throw error;
    }
  },

  removeWaterIntake: async (amount) => {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // For removal, we add a negative entry
    return await get().addWaterIntake(-Math.abs(amount), 'manual');
  },

  refreshTodayIntake: async () => {
    const { authUser } = get();
    
    if (!authUser) {
      return;
    }
    
    try {
      const todayLogs = await waterIntakeAPI.getToday(authUser.$id);
      const totalToday = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      
      // Get pending sync count
      const pendingSyncCount = await waterIntakeLogsService.getPendingCount();
      
      set({
        todayIntake: todayLogs,
        totalToday,
        pendingSyncCount
      });
      
    } catch (error) {
      console.error('Failed to refresh intake:', error);
    }
  },

  syncOfflineData: async () => {
    set({ syncStatus: 'syncing' });
    
    try {
      const result = await waterIntakeLogsService.syncOfflineQueue();
      
      if (result.failed === 0) {
        set({ syncStatus: 'synced', pendingSyncCount: 0 });
      } else {
        set({ syncStatus: 'error', pendingSyncCount: result.failed });
      }
      
      // Refresh today's data after sync
      await get().refreshTodayIntake();
      
      return result;
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      set({ syncStatus: 'error' });
      throw error;
    }
  },

  // Set up sync listener
  setupSyncListener: () => {
    return waterIntakeLogsService.addSyncListener((status, pendingCount) => {
      set({ 
        syncStatus: status === 'queued' || status === 'syncing' ? 'syncing' : 
                   status === 'synced' ? 'synced' : 
                   status === 'error' ? 'error' : 'idle',
        pendingSyncCount: pendingCount 
      });
    });
  },

  logout: async () => {
    try {
      // Try to sync any pending data before logout
      await waterIntakeLogsService.syncOfflineQueue();
      
      await authAPI.logout();
      set({
        authUser: null,
        userProfile: null,
        healthProfile: null,
        recommendedIntake: null,
        todayIntake: [],
        totalToday: 0,
        syncStatus: 'idle',
        pendingSyncCount: 0
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}));

// Helper function
function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}