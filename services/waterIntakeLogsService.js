// services/waterIntakeLogsService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { waterIntakeAPI } from './appwriteService';

const OFFLINE_QUEUE_KEY = '@water_intake_offline_queue';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

/**
 * Water Intake Logs Service with Offline Queue Support
 * Handles reliable storage of water intake logs with automatic cloud sync
 */
export class WaterIntakeLogsService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = new Set();
  }

  /**
   * Add a sync listener that gets called when sync status changes
   * @param {Function} listener - Callback function (status, pendingCount)
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
   * Add a water intake log entry with offline queue support
   * @param {string} userId - User ID
   * @param {number} amount - Amount in ml
   * @param {string} source - Source of the entry (bluetooth, manual)
   * @returns {Promise<object>} The created log entry
   */
  async addWaterIntake(userId, amount, source = 'bluetooth') {
    const timestamp = new Date().toISOString();
    const entry = {
      userId,
      amount,
      source,
      timestamp,
      localId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
      createdAt: timestamp
    };

    try {
      // First, add to offline queue
      await this.addToOfflineQueue(entry);

      // Try to sync immediately
      const cloudEntry = await this.syncSingleEntry(entry);
      
      if (cloudEntry) {
        // Success! Remove from queue
        await this.removeFromOfflineQueue(entry.localId);
        return cloudEntry;
      } else {
        // Failed, but it's in the queue for retry
        console.log('Entry saved offline, will retry sync later');
        return entry; // Return local entry
      }
    } catch (error) {
      console.error('Error adding water intake:', error);
      // Entry is in offline queue, will be retried
      throw error;
    }
  }

  /**
   * Sync a single entry to the cloud
   * @param {object} entry - The entry to sync
   * @returns {Promise<object|null>} Cloud document or null if failed
   */
  async syncSingleEntry(entry) {
    try {
      const cloudEntry = await waterIntakeAPI.create(
        entry.userId,
        entry.amount,
        entry.source,
        entry.timestamp // Pass the original timestamp
      );
      
      console.log('Successfully synced entry to cloud:', cloudEntry.$id);
      return cloudEntry;
    } catch (error) {
      console.error('Failed to sync entry to cloud:', error);
      return null;
    }
  }

  /**
   * Add entry to offline queue
   * @param {object} entry - Entry to add
   */
  async addToOfflineQueue(entry) {
    try {
      const queue = await this.getOfflineQueue();
      queue.push(entry);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log('Added entry to offline queue, total:', queue.length);
      this.notifySyncListeners('queued', queue.length);
    } catch (error) {
      console.error('Error adding to offline queue:', error);
      throw error;
    }
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
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  /**
   * Remove entry from offline queue
   * @param {string} localId - Local ID of entry to remove
   */
  async removeFromOfflineQueue(localId) {
    try {
      const queue = await this.getOfflineQueue();
      const newQueue = queue.filter(entry => entry.localId !== localId);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
      console.log('Removed entry from offline queue, remaining:', newQueue.length);
      this.notifySyncListeners('synced', newQueue.length);
    } catch (error) {
      console.error('Error removing from offline queue:', error);
    }
  }

  /**
   * Update retry count for an entry
   * @param {string} localId - Local ID of entry
   */
  async incrementRetryCount(localId) {
    try {
      const queue = await this.getOfflineQueue();
      const entry = queue.find(e => e.localId === localId);
      if (entry) {
        entry.retryCount = (entry.retryCount || 0) + 1;
        entry.lastRetryAt = new Date().toISOString();
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Error updating retry count:', error);
    }
  }

  /**
   * Sync all offline entries to cloud
   * @returns {Promise<{synced: number, failed: number}>} Sync results
   */
  async syncOfflineQueue() {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifySyncListeners('syncing', 0);

    try {
      const queue = await this.getOfflineQueue();
      
      if (queue.length === 0) {
        console.log('No offline entries to sync');
        this.notifySyncListeners('idle', 0);
        return { synced: 0, failed: 0 };
      }

      console.log(`Starting sync of ${queue.length} offline entries...`);
      let synced = 0;
      let failed = 0;

      for (const entry of queue) {
        // Skip if retried too many times
        if (entry.retryCount >= MAX_RETRY_ATTEMPTS) {
          console.log(`Entry ${entry.localId} exceeded max retries, skipping`);
          failed++;
          continue;
        }

        const cloudEntry = await this.syncSingleEntry(entry);
        
        if (cloudEntry) {
          await this.removeFromOfflineQueue(entry.localId);
          synced++;
        } else {
          await this.incrementRetryCount(entry.localId);
          failed++;
          // Add delay between retries
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }

      const remainingQueue = await this.getOfflineQueue();
      console.log(`Sync complete: ${synced} synced, ${failed} failed, ${remainingQueue.length} remaining`);
      this.notifySyncListeners(remainingQueue.length > 0 ? 'idle' : 'synced', remainingQueue.length);

      return { synced, failed };
    } catch (error) {
      console.error('Error syncing offline queue:', error);
      const queue = await this.getOfflineQueue();
      this.notifySyncListeners('error', queue.length);
      return { synced: 0, failed: queue.length };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get count of pending offline entries
   * @returns {Promise<number>} Count of pending entries
   */
  async getPendingCount() {
    const queue = await this.getOfflineQueue();
    return queue.length;
  }

  /**
   * Clear all offline entries (use with caution!)
   */
  async clearOfflineQueue() {
    try {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      console.log('Offline queue cleared');
      this.notifySyncListeners('idle', 0);
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  }

  /**
   * Get failed entries that need attention
   * @returns {Promise<Array>} Failed entries
   */
  async getFailedEntries() {
    const queue = await this.getOfflineQueue();
    return queue.filter(entry => entry.retryCount >= MAX_RETRY_ATTEMPTS);
  }
}

// Export singleton instance
export const waterIntakeLogsService = new WaterIntakeLogsService();
