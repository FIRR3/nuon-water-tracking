// store/useUserStore.js
import { create } from 'zustand';
import { 
  authAPI, 
  userProfileAPI, 
  healthProfileAPI, 
  waterIntakeAPI 
} from '../services/appwriteService';
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
      
      set({
        authUser,
        userProfile,
        healthProfile,
        recommendedIntake,
        todayIntake: todayLogs,
        totalToday,
        isLoading: false
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
    
    try {
      const newLog = await waterIntakeAPI.create(authUser.$id, amount, source);
      
      set({
        todayIntake: [newLog, ...todayIntake],
        totalToday: totalToday + amount
      });
      
      return newLog;
      
    } catch (error) {
      console.error('Failed to add water intake:', error);
      throw error;
    }
  },

  refreshTodayIntake: async () => {
    const { authUser } = get();
    
    try {
      const todayLogs = await waterIntakeAPI.getToday(authUser.$id);
      const totalToday = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      
      set({
        todayIntake: todayLogs,
        totalToday
      });
      
    } catch (error) {
      console.error('Failed to refresh intake:', error);
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
      set({
        authUser: null,
        userProfile: null,
        healthProfile: null,
        recommendedIntake: null,
        todayIntake: [],
        totalToday: 0
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