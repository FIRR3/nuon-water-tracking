// hooks/useSyncManager.js
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { dailySummariesOfflineService } from '../services/dailySummariesOfflineService';
import { offlineEditsService } from '../services/offlineEditsService';
import { waterIntakeLogsService } from '../services/waterIntakeLogsService';
import { verifyAndFixDateRange } from '../utils/dailySummaryMaintenance';
import { useUserStore } from './useUserStore';

/**
 * Custom hook to manage automatic syncing of offline data
 * Syncs water intake logs, profile edits, and daily summaries when:
 * - App comes to foreground
 * - Network connectivity is restored
 * - Periodically when app is active
 */
export const useSyncManager = (enabled = true) => {
  const { setPendingCounts, authUser, userHealthProfile, recommendedIntake } = useUserStore();
  const appState = useRef(AppState.currentState);
  const syncIntervalRef = useRef(null);
  const lastSyncTimeRef = useRef(0);

  const SYNC_INTERVAL_MS = 5 * 60 * 1000; // Sync every 5 minutes
  const MIN_SYNC_DELAY_MS = 30 * 1000; // Minimum 30 seconds between syncs

  const performSync = async () => {
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimeRef.current;

    // Prevent syncing too frequently
    if (timeSinceLastSync < MIN_SYNC_DELAY_MS) {
      return;
    }

    try {
      
      // Sync water intake logs and daily summaries in parallel
      const [waterResult, summariesResult] = await Promise.all([
        waterIntakeLogsService.syncOfflineQueue(),
        dailySummariesOfflineService.syncOfflineQueue(),
      ]);
      
      // Sync profile edits
      const editsResult = await offlineEditsService.syncOfflineQueue();
      
      lastSyncTimeRef.current = now;
      
      const totalSynced = waterResult.synced + editsResult.synced + summariesResult.synced;
      const totalFailed = waterResult.failed + editsResult.failed + summariesResult.failed;
      

      // Verify and fix daily summaries to match logs (last 7 days) after both syncs complete
      if (authUser?.$id && (waterResult.synced > 0 || summariesResult.synced > 0)) {
        const currentGoal = userHealthProfile?.customWaterGoal || recommendedIntake || 2400;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        
        try {
          const fixResult = await verifyAndFixDateRange(authUser.$id, startDate, endDate, currentGoal);
          
          // If summaries were fixed, sync them immediately
          if (fixResult?.fixed > 0) {
            const fixedSyncResult = await dailySummariesOfflineService.syncOfflineQueue();
          }
        } catch (error) {
          // Don't let verification errors break the sync flow
          const isNetworkError = error.message?.toLowerCase().includes('network') || 
                                error.message?.toLowerCase().includes('fetch');
          if (isNetworkError) {
          } else {
            console.error('❌ Error verifying summaries:', error.message);
          }
        }
      }

      // Update pending counts in the store after sync completes
      const pendingSyncCount = await waterIntakeLogsService.getPendingCount();
      const pendingEditsCount = await offlineEditsService.getPendingCount();
      const pendingSummaryUpdates = await dailySummariesOfflineService.getPendingCount();
      setPendingCounts(pendingSyncCount, pendingEditsCount, pendingSummaryUpdates);
      
      // Refresh data from cloud after successful sync
      if (totalSynced > 0) {
        // Access useUserStore to call refreshTodayIntake
        const { refreshTodayIntake } = require('./useUserStore').useUserStore.getState();
        await refreshTodayIntake();
      }
      
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Handle app state changes
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        performSync();
      }
      appState.current = nextAppState;
    });

    // Handle network connectivity changes
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        performSync();
      }
    });

    // Set up periodic sync when app is active
    syncIntervalRef.current = setInterval(() => {
      if (appState.current === 'active') {
        performSync();
      }
    }, SYNC_INTERVAL_MS);

    // Perform initial sync on mount
    performSync();

    // Cleanup
    return () => {
      appStateSubscription?.remove();
      unsubscribeNetInfo();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [enabled]);

  return {
    triggerManualSync: performSync
  };
};
