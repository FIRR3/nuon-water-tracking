// services/dailySummariesOfflineService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dailySummariesAPI } from './dailySummariesAPI';

const OFFLINE_QUEUE_KEY = '@daily_summaries_offline_queue';

/**
 * Daily Summaries Offline Service
 * Handles offline queueing and syncing of daily summary updates
 */
export class DailySummariesOfflineService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = new Set();
  }

  /**
   * Add a sync listener
   * @param {Function} listener - Callback function (status, pendingCount)
   * @returns {Function} Unsubscribe function
   */
  addSyncListener(listener) {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Notify all sync listeners
   */
  notifySyncListeners(status, pendingCount) {
    this.syncListeners.forEach(listener => {
      try {
        listener(status, pendingCount);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Get offline queue
   * @returns {Promise<Array>} Queue entries
   */
  async getOfflineQueue() {
    try {
      const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  /**
   * Save offline queue
   * @param {Array} queue - Queue entries
   */
  async saveOfflineQueue(queue) {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Queue a summary update when offline
   * Merges multiple updates to the same date
   * @param {string} userId - User ID
   * @param {string} date - ISO datetime string (midnight)
   * @param {object} summary - Summary data
   */
  async queueSummaryUpdate(userId, date, summary) {
    try {
      const queue = await this.getOfflineQueue();
      
      // Check if there's already a queued update for this date
      const existingIndex = queue.findIndex(
        item => item.userId === userId && item.date === date
      );
      
      const queueEntry = {
        userId,
        date,
        summary: {
          ...summary,
          // Preserve the updatedAt from the summary (the actual time of the action)
          updatedAt: summary.updatedAt || new Date().toISOString(),
        },
        queuedAt: new Date().toISOString(),
      };
      
      if (existingIndex !== -1) {
        // Merge with existing entry (keep most recent data)
        const existing = queue[existingIndex];
        const existingUpdated = new Date(existing.summary.updatedAt);
        const newUpdated = new Date(queueEntry.summary.updatedAt);
        
        if (newUpdated > existingUpdated) {
          // Replace with newer data
          queue[existingIndex] = queueEntry;
        } else {
          // Keep existing (it's newer)
          console.log('Keeping existing queued summary (newer)');
        }
      } else {
        // Add new entry
        queue.push(queueEntry);
      }
      
      await this.saveOfflineQueue(queue);
      this.notifySyncListeners('queued', queue.length);
      console.log('✅ Queued summary update for', date, '- Total queued:', queue.length);
      
    } catch (error) {
      console.error('Error queueing summary update:', error);
      throw error;
    }
  }

  /**
   * Sync a single summary to cloud
   * @param {object} entry - Queue entry
   * @returns {Promise<boolean>} True if successful
   */
  async syncSingleSummary(entry) {
    try {
      // Extract only the fields that Appwrite expects
      const summaryData = {
        totalIntake: entry.summary.totalIntake,
        goalAmount: entry.summary.goalAmount,
        numberOfDrinks: entry.summary.numberOfDrinks,
        firstDrink: entry.summary.firstDrink,
        lastDrink: entry.summary.lastDrink,
      };
      
      await dailySummariesAPI.upsert(
        entry.userId,
        entry.date,
        summaryData
      );
      console.log('✅ Synced summary to cloud:', entry.date);
      return true;
    } catch (error) {
      // Check if it's a network error (offline) vs actual error
      const isNetworkError = error.message?.toLowerCase().includes('network') || 
                            error.message?.toLowerCase().includes('fetch');
      
      if (isNetworkError) {
        console.log('⚠️ Offline - summary will sync when connection restored:', entry.date);
      } else {
        console.error('❌ Failed to sync summary:', entry.date, error.message);
      }
      return false;
    }
  }

  /**
   * Sync offline queue to cloud
   * @returns {Promise<{synced: number, failed: number}>} Sync results
   */
  async syncOfflineQueue() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { synced: 0, failed: 0 };
    }
    
    this.isSyncing = true;
    this.notifySyncListeners('syncing', 0);
    
    try {
      const queue = await this.getOfflineQueue();
      
      if (queue.length === 0) {
        console.log('No summary updates to sync');
        this.isSyncing = false;
        return { synced: 0, failed: 0 };
      }
      
      console.log(`Syncing ${queue.length} summary update(s)...`);
      
      let synced = 0;
      let failed = 0;
      const remainingQueue = [];
      
      for (const entry of queue) {
        const success = await this.syncSingleSummary(entry);
        
        if (success) {
          synced++;
        } else {
          failed++;
          remainingQueue.push(entry);
        }
      }
      
      // Save remaining queue
      await this.saveOfflineQueue(remainingQueue);
      
      this.notifySyncListeners(
        failed === 0 ? 'synced' : 'error',
        remainingQueue.length
      );
      
      console.log(`Summary sync complete: ${synced} synced, ${failed} failed`);
      
      return { synced, failed };
      
    } catch (error) {
      console.error('Error syncing summary queue:', error);
      this.notifySyncListeners('error', 0);
      return { synced: 0, failed: 0 };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get count of pending summary updates
   * @returns {Promise<number>} Pending count
   */
  async getPendingCount() {
    const queue = await this.getOfflineQueue();
    return queue.length;
  }

  /**
   * Remove a specific summary from the offline queue
   * Used when a summary is successfully synced immediately
   * @param {string} userId - User ID
   * @param {string} date - ISO datetime string (midnight)
   */
  async removeSummaryFromQueue(userId, date) {
    try {
      const queue = await this.getOfflineQueue();
      const newQueue = queue.filter(
        entry => !(entry.userId === userId && entry.date === date)
      );
      
      if (newQueue.length < queue.length) {
        await this.saveOfflineQueue(newQueue);
        this.notifySyncListeners('synced', newQueue.length);
        console.log('Removed summary from offline queue, remaining:', newQueue.length);
      }
    } catch (error) {
      console.error('Error removing summary from offline queue:', error);
    }
  }

  /**
   * Clear offline queue
   */
  async clearQueue() {
    await this.saveOfflineQueue([]);
    this.notifySyncListeners('cleared', 0);
  }
}

// Export singleton instance
export const dailySummariesOfflineService = new DailySummariesOfflineService();
