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
      console.log('Skipping sync - too soon since last sync');
      return;
    }

    try {
      console.log('Performing automatic sync...');
      
      // Sync water intake logs
      const waterResult = await waterIntakeLogsService.syncOfflineQueue();
      
      // Sync profile edits
      const editsResult = await offlineEditsService.syncOfflineQueue();
      
      // Sync daily summaries
      const summariesResult = await dailySummariesOfflineService.syncOfflineQueue();
      
      lastSyncTimeRef.current = now;
      
      const totalSynced = waterResult.synced + editsResult.synced + summariesResult.synced;
      const totalFailed = waterResult.failed + editsResult.failed + summariesResult.failed;
      
      if (totalSynced > 0) {
        console.log(`Auto-sync completed: ${totalSynced} entries synced (${waterResult.synced} water, ${editsResult.synced} edits, ${summariesResult.synced} summaries)`);
      }
      
      if (totalFailed > 0) {
        console.log(`Auto-sync: ${totalFailed} entries failed, will retry later`);
      }

      // Verify and fix daily summaries to match logs (last 7 days)
      if (authUser?.$id && waterResult.synced > 0) {
        const currentGoal = userHealthProfile?.customWaterGoal || recommendedIntake || 2400;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        
        try {
          console.log('🔍 Verifying summaries match water logs...');
          await verifyAndFixDateRange(authUser.$id, startDate, endDate, currentGoal);
        } catch (error) {
          // Don't let verification errors break the sync flow
          const isNetworkError = error.message?.toLowerCase().includes('network') || 
                                error.message?.toLowerCase().includes('fetch');
          if (isNetworkError) {
            console.log('⚠️ Could not verify summaries (offline), will verify later');
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
        console.log('🔄 Refreshing data after sync...');
        // Access useUserStore to call refreshTodayIntake
        const { refreshTodayIntake } = require('./useUserStore').useUserStore.getState();
        await refreshTodayIntake();
        console.log('✅ Data refreshed from cloud');
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
        console.log('App has come to foreground - triggering sync');
        performSync();
      }
      appState.current = nextAppState;
    });

    // Handle network connectivity changes
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Network connectivity restored - triggering sync');
        performSync();
      }
    });

    // Set up periodic sync when app is active
    syncIntervalRef.current = setInterval(() => {
      if (appState.current === 'active') {
        console.log('Periodic sync triggered');
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
