// hooks/useSyncManager.js
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { waterIntakeLogsService } from '../services/waterIntakeLogsService';

/**
 * Custom hook to manage automatic syncing of offline water intake logs
 * Syncs when:
 * - App comes to foreground
 * - Network connectivity is restored
 * - Periodically when app is active
 */
export const useSyncManager = (enabled = true) => {
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
      const result = await waterIntakeLogsService.syncOfflineQueue();
      lastSyncTimeRef.current = now;
      
      if (result.synced > 0) {
        console.log(`Auto-sync completed: ${result.synced} entries synced`);
      }
      
      if (result.failed > 0) {
        console.log(`Auto-sync: ${result.failed} entries failed, will retry later`);
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
