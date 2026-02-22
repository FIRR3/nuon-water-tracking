// store/useUserStore.js
import { create } from "zustand";
import {
  authAPI,
  healthProfileAPI,
  userProfileAPI,
  waterIntakeAPI,
} from "../services/appwriteService";
import { dailySummariesOfflineService } from "../services/dailySummariesOfflineService";
import { offlineEditsService } from "../services/offlineEditsService";
import {
  getHealthProfile,
  getTodayWaterIntake as getLocalWaterIntake,
  getTodaysSummary,
  getUserProfile,
  saveDailySummary,
  saveHealthProfile,
  saveUserProfile,
} from "../services/storage";
import { waterIntakeLogsService } from "../services/waterIntakeLogsService";
import { calculateRecommendedWaterIntake } from "../utils/waterCalculations";

export const useUserStore = create((set, get) => ({
  // State
  authUser: null,
  userProfile: null,
  healthProfile: null,
  recommendedIntake: null,
  todayIntake: [],
  totalToday: 0,
  todaySummary: null, // NEW: Daily summary for today
  isLoading: false,
  error: null,
  syncStatus: "idle", // 'idle', 'syncing', 'synced', 'error'
  pendingSyncCount: 0,
  pendingEditsCount: 0,
  pendingSummaryUpdates: 0, // NEW: Pending summary syncs
  isOffline: false,
  lastRefreshTime: null, // Force re-renders when refreshing

  // Actions
  fetchUserData: async () => {
    set({ isLoading: true, error: null });

    try {
      // Get auth user
      const authUser = await authAPI.getCurrentUser();

      // STEP 1: Load cached data IMMEDIATELY for instant UI
      let userProfile = await getUserProfile();
      let healthProfile = await getHealthProfile();

      // Get today's water intake from daily summary (source of truth)
      let totalToday = 0;
      const todaySummary = await getTodaysSummary(authUser.$id);
      if (todaySummary) {
        totalToday = todaySummary.totalIntake;
      } else {
        // Fallback to water history if no summary exists
        totalToday = await getLocalWaterIntake();
      }

      // If we have cached data, update store immediately
      if (userProfile && healthProfile) {
        const age = userProfile.birthday
          ? calculateAge(userProfile.birthday)
          : 25;
        const cachedRecommendedIntake = calculateRecommendedWaterIntake({
          weight: healthProfile.weight,
          height: healthProfile.height * 100,
          activityLevel: healthProfile.activityLevel,
          age: age,
          gender: healthProfile.gender,
          customGoal: healthProfile.customWaterGoal,
        });

        set({
          authUser,
          userProfile,
          healthProfile,
          recommendedIntake: cachedRecommendedIntake,
          totalToday,
          isLoading: false,
          isOffline: false, // Will update if cloud fetch fails
        });
      }

      // STEP 2: Try to get fresh data from cloud in background
      let usedCache = false;

      try {
        userProfile = await userProfileAPI.get(authUser.$id);
        healthProfile = await healthProfileAPI.getByUserId(authUser.$id);

        // Cache locally for offline use
        await saveUserProfile(userProfile);
        await saveHealthProfile(healthProfile);
      } catch (error) {
        console.error("Failed to fetch fresh data from cloud:", error.message);
        // Fallback to cached data
        userProfile = await getUserProfile();
        healthProfile = await getHealthProfile();
        usedCache = true;

        if (!userProfile || !healthProfile) {
          throw new Error("No cached profile data available");
        }
      }

      // Calculate recommended intake
      let recommendedIntake = null;
      if (healthProfile && userProfile) {
        const age = userProfile.birthday
          ? calculateAge(userProfile.birthday)
          : 25;
        recommendedIntake = calculateRecommendedWaterIntake({
          weight: healthProfile.weight,
          height: healthProfile.height * 100, // Convert m to cm
          activityLevel: healthProfile.activityLevel,
          age: age,
          gender: healthProfile.gender,
          customGoal: healthProfile.customWaterGoal,
        });
      }

      // Get today's intake from cloud
      let todayLogs = [];
      let cloudTotalToday = 0;
      let usedLocalFallback = false;

      try {
        todayLogs = await waterIntakeAPI.getToday(authUser.$id);
        cloudTotalToday = todayLogs.reduce((sum, log) => sum + log.amount, 0);

        // Use cloud data as the new total
        totalToday = cloudTotalToday;
      } catch (error) {
        console.error(
          "Could not fetch cloud data, keeping cached total:",
          error.message,
        );
        // Keep the cached totalToday we loaded earlier from daily summary
        usedLocalFallback = true;
      }

      // If we got cloud data, add offline entries that haven't synced yet
      if (!usedLocalFallback) {
        const offlineEntries =
          await waterIntakeLogsService.getTodayOfflineEntries(authUser.$id);
        const offlineTotal = offlineEntries.reduce(
          (sum, entry) => sum + entry.amount,
          0,
        );
        totalToday += offlineTotal;
        todayLogs = [...todayLogs, ...offlineEntries];
      }

      // Get pending sync counts
      const pendingSyncCount = await waterIntakeLogsService.getPendingCount();
      const pendingEditsCount = await offlineEditsService.getPendingCount();

      set({
        authUser,
        userProfile,
        healthProfile,
        recommendedIntake,
        todayIntake: todayLogs,
        totalToday,
        pendingSyncCount,
        pendingEditsCount,
        isOffline: usedCache,
        isLoading: false,
      });

      // Sync offline queues in background
      if (!usedCache) {
        // Sync water intake queue
        waterIntakeLogsService
          .syncOfflineQueue()
          .then((result) => {
            if (result.synced > 0) {
              get().refreshTodayIntake();
            }
          })
          .catch((error) => {
            console.error("Background sync failed (offline?):", error.message);
          });

        // Sync edits queue
        offlineEditsService
          .syncOfflineQueue()
          .then((result) => {
            if (result.synced > 0) {
              // Update pending count only - local state is already updated
              const pendingEditsCount = offlineEditsService.getPendingCount();
              pendingEditsCount.then((count) =>
                set({ pendingEditsCount: count }),
              );
            }
          })
          .catch((error) => {
            console.error(
              "Background edits sync failed (offline?):",
              error.message,
            );
          });
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  updateHealthProfile: async (updates) => {
    const { authUser, healthProfile, userProfile } = get();

    try {
      // Update local cache immediately
      const updatedProfile = { ...healthProfile, ...updates };
      await saveHealthProfile(updatedProfile);

      // Update local state for immediate UI response
      set({ healthProfile: updatedProfile });

      // Recalculate recommended intake
      const recommendedIntake = calculateRecommendedWaterIntake({
        weight: updatedProfile.weight,
        height: updatedProfile.height * 100,
        activityLevel: updatedProfile.activityLevel,
        age: userProfile?.birthday ? calculateAge(userProfile.birthday) : 25,
        gender: updatedProfile.gender,
        customGoal: updatedProfile.customWaterGoal,
      });

      set({ recommendedIntake });

      // Queue for cloud sync (will sync immediately if online, or later if offline)
      await offlineEditsService.queueHealthProfileEdit(authUser.$id, updates);

      // Update pending count
      const pendingEditsCount = await offlineEditsService.getPendingCount();
      set({ pendingEditsCount });
    } catch (error) {
      console.error("Failed to update health profile:", error);
      throw error;
    }
  },

  updateUserProfile: async (updates) => {
    const { authUser } = get();

    try {
      // Update local cache immediately
      const currentProfile = await getUserProfile();
      const updatedProfile = { ...currentProfile, ...updates };
      await saveUserProfile(updatedProfile);

      // Update local state for immediate UI response
      set({ userProfile: updatedProfile });

      // Queue for cloud sync
      await offlineEditsService.queueUserProfileEdit(authUser.$id, updates);

      // Update pending count
      const pendingEditsCount = await offlineEditsService.getPendingCount();
      set({ pendingEditsCount });
    } catch (error) {
      console.error("Failed to update user profile:", error);
      throw error;
    }
  },

  addWaterIntake: async (amount, source = "bluetooth") => {
    const {
      authUser,
      todayIntake,
      totalToday,
      healthProfile,
      recommendedIntake,
    } = get();

    if (!authUser) {
      console.error("No authenticated user");
      throw new Error("User not authenticated");
    }

    // Ensure amount is an integer
    const intAmount = Math.round(amount);

    // Validate that we won't go below 0
    if (totalToday + intAmount < 0) {
      console.warn("⚠️ Attempted to reduce water intake below 0, capping at 0");
      // Cap at current total (so we reach exactly 0)
      return await get().addWaterIntake(-totalToday, source);
    }

    // Get current water goal
    const currentGoal =
      healthProfile?.customWaterGoal || recommendedIntake || 2400;

    try {
      // Use the new service with offline queue support (includes summary update)
      const newLog = await waterIntakeLogsService.addWaterIntake(
        authUser.$id,
        intAmount,
        source,
        currentGoal, // Pass current goal for summary
      );

      // CRITICAL: Validate newLog before updating state
      if (!newLog || typeof newLog !== "object") {
        console.error("❌ Invalid newLog returned from service:", newLog);
        // Still update totalToday so UI reflects the change
        set({ totalToday: totalToday + intAmount });
        return null;
      }

      // Update local state immediately for responsiveness
      set({
        todayIntake: [newLog, ...todayIntake],
        totalToday: totalToday + intAmount,
      });

      // Update pending counts
      const pendingSyncCount = await waterIntakeLogsService.getPendingCount();
      const pendingSummaryUpdates =
        await dailySummariesOfflineService.getPendingCount();
      set({ pendingSyncCount, pendingSummaryUpdates });

      // Refresh today's summary from cache
      const summary = await getTodaysSummary(authUser.$id);
      set({ todaySummary: summary });

      return newLog;
    } catch (error) {
      console.error("❌ Exception in addWaterIntake:", error);
      // Still update totalToday so UI reflects the change even if there's an error
      set({ totalToday: totalToday + intAmount });
      return null;
    }
  },

  removeWaterIntake: async (amount) => {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // For removal, we add a negative entry
    return await get().addWaterIntake(-Math.abs(amount), "manual");
  },

  refreshTodayIntake: async () => {
    const { authUser } = get();

    if (!authUser) {
      return;
    }

    // Try to get cloud data
    let todayLogs = [];
    let totalToday = 0;
    let usedLocalFallback = false;

    try {
      todayLogs = await waterIntakeAPI.getToday(authUser.$id);
      totalToday = todayLogs.reduce((sum, log) => sum + log.amount, 0);

      // Update local cache with fresh cloud data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();
      const cachedSummary = await getTodaysSummary(authUser.$id);
      if (cachedSummary && cachedSummary.totalIntake !== totalToday) {
        // Update cached summary to match cloud
        cachedSummary.totalIntake = totalToday;
        cachedSummary.numberOfDrinks = todayLogs.length;
        await saveDailySummary(authUser.$id, cachedSummary);
      }
    } catch (error) {
      console.error(
        "Could not fetch from cloud, using cached data:",
        error.message,
      );
      // Fallback to daily summary (source of truth) or water history
      const todaySummary = await getTodaysSummary(authUser.$id);
      if (todaySummary) {
        totalToday = todaySummary.totalIntake;
      } else {
        totalToday = await getLocalWaterIntake();
      }
      usedLocalFallback = true;
    }

    // If we used local fallback, don't add offline entries again
    if (!usedLocalFallback) {
      // Get offline queue entries for today only if we got cloud data
      const offlineEntries =
        await waterIntakeLogsService.getTodayOfflineEntries(authUser.$id);
      const offlineTotal = offlineEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      );

      // Merge: cloud logs + offline entries
      totalToday += offlineTotal;
      todayLogs = [...todayLogs, ...offlineEntries];
    }

    // Get pending sync count
    const pendingSyncCount = await waterIntakeLogsService.getPendingCount();

    // Always update state to trigger re-render, add timestamp to force change
    set({
      todayIntake: todayLogs,
      totalToday,
      pendingSyncCount,
      lastRefreshTime: Date.now(), // Force state change for React
    });
  },

  syncOfflineData: async () => {
    set({ syncStatus: "syncing" });

    try {
      const result = await waterIntakeLogsService.syncOfflineQueue();

      if (result.failed === 0) {
        set({ syncStatus: "synced", pendingSyncCount: 0 });
      } else {
        set({ syncStatus: "error", pendingSyncCount: result.failed });
      }

      // Refresh today's data after sync
      await get().refreshTodayIntake();

      return result;
    } catch (error) {
      console.error("Failed to sync offline data:", error);
      set({ syncStatus: "error" });
      throw error;
    }
  },

  // Set up sync listener
  setupSyncListener: () => {
    return waterIntakeLogsService.addSyncListener((status, pendingCount) => {
      set({
        syncStatus:
          status === "queued" || status === "syncing"
            ? "syncing"
            : status === "synced"
              ? "synced"
              : status === "error"
                ? "error"
                : "idle",
        pendingSyncCount: pendingCount,
      });
    });
  },

  logout: async () => {
    try {
      // Try to sync any pending data before logout
      await waterIntakeLogsService.syncOfflineQueue();
      await offlineEditsService.syncOfflineQueue();

      await authAPI.logout();
      set({
        authUser: null,
        userProfile: null,
        healthProfile: null,
        recommendedIntake: null,
        todayIntake: [],
        totalToday: 0,
        syncStatus: "idle",
        pendingSyncCount: 0,
        pendingEditsCount: 0,
        isOffline: false,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },

  syncAllOfflineData: async () => {
    set({ syncStatus: "syncing" });

    try {
      // Sync water intake
      const waterResult = await waterIntakeLogsService.syncOfflineQueue();

      // Sync profile edits
      const editsResult = await offlineEditsService.syncOfflineQueue();

      const totalFailed = waterResult.failed + editsResult.failed;
      const totalSynced = waterResult.synced + editsResult.synced;

      if (totalFailed === 0) {
        set({
          syncStatus: "synced",
          pendingSyncCount: 0,
          pendingEditsCount: 0,
        });
      } else {
        set({
          syncStatus: "error",
          pendingSyncCount: waterResult.failed,
          pendingEditsCount: editsResult.failed,
        });
      }

      // Refresh data after sync
      if (totalSynced > 0) {
        await get().fetchUserData();
      }

      return { synced: totalSynced, failed: totalFailed };
    } catch (error) {
      console.error("Failed to sync offline data:", error);
      set({ syncStatus: "error" });
      throw error;
    }
  },

  // Helper function to update pending counts (used by sync manager)
  setPendingCounts: (
    pendingSyncCount,
    pendingEditsCount,
    pendingSummaryUpdates,
  ) => {
    set({ pendingSyncCount, pendingEditsCount, pendingSummaryUpdates });
  },
}));

// Helper function
function calculateAge(birthday) {
  // Parse the date part only (YYYY-MM-DD) to avoid timezone shifting
  const datePart = birthday.split("T")[0];
  const [birthYear, birthMonth, birthDay] = datePart.split("-").map(Number);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  let age = todayYear - birthYear;

  if (
    todayMonth < birthMonth ||
    (todayMonth === birthMonth && todayDay < birthDay)
  ) {
    age--;
  }

  return age;
}
