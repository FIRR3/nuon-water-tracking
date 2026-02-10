// services/waterIntakeLogsService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { waterIntakeAPI } from './appwriteService';
import { dailySummariesOfflineService } from './dailySummariesOfflineService';
import { getDailySummary, saveDailySummary, addWaterEntry as saveToLocalStorage } from './storage';

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
   * @param {number} currentGoal - User's current water goal in ml
   * @returns {Promise<object>} The created log entry
   */
  async addWaterIntake(userId, amount, source = 'bluetooth', currentGoal = 2400) {
    const timestamp = new Date().toISOString();
    
    // Ensure amount is an integer (Appwrite requires signed 64-bit integer)
    const intAmount = Math.round(amount);
    
    const entry = {
      userId,
      amount: intAmount,
      source,
      timestamp,
      localId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
      createdAt: timestamp
    };

    try {
      // ALWAYS save to local storage first (dual write pattern)
      await saveToLocalStorage(intAmount);
      console.log('✅ Saved to local storage:', intAmount);
      
      // Update daily summary (immediately)
      await this.updateDailySummary(userId, intAmount, timestamp, currentGoal);
      
      // Add to offline queue
      await this.addToOfflineQueue(entry);
      console.log('✅ Added to offline queue:', entry.localId);

      // Try to sync immediately
      const cloudEntry = await this.syncSingleEntry(entry);
      
      if (cloudEntry) {
        // Success! Remove from queue
        await this.removeFromOfflineQueue(entry.localId);
        console.log('✅ Synced to cloud immediately:', cloudEntry.$id);
        return cloudEntry;
      } else {
        // Failed, but it's in local storage and queue for retry
        console.log('⚠️ Cloud sync failed, entry queued for retry:', entry.localId);
        return entry; // Return local entry - ALWAYS return valid entry
      }
    } catch (error) {
      console.error('❌ Error in addWaterIntake, but entry is saved locally:', error);
      // CRITICAL: Even if there's an error, the entry is saved locally and queued
      // ALWAYS return the entry so the UI can update - NEVER throw here
      return entry;
    }
  }

  /**
   * Update daily summary when water is added
   * @param {string} userId - User ID
   * @param {number} amount - Amount in ml (can be negative for removal)
   * @param {string} timestamp - ISO timestamp of the drink
   * @param {number} currentGoal - User's current water goal in ml
   */
  async updateDailySummary(userId, amount, timestamp, currentGoal) {
    try {
      // Get date at midnight for this timestamp
      const drinkDate = new Date(timestamp);
      drinkDate.setHours(0, 0, 0, 0);
      const dateStr = drinkDate.toISOString();
      
      // Get or create summary for this date
      let summary = await getDailySummary(userId, dateStr);
      
      if (!summary) {
        // Create new summary
        summary = {
          userId,
          date: dateStr, // ISO datetime at midnight
          totalIntake: 0,
          goalAmount: currentGoal,
          numberOfDrinks: 0,
          firstDrink: null,
          lastDrink: null,
          updatedAt: timestamp,
        };
      }
      
      // Update summary fields
      summary.totalIntake += amount;
      summary.goalAmount = currentGoal; // Always use current goal
      
      if (amount > 0) {
        // Positive amount - increment drinks and update lastDrink
        summary.numberOfDrinks += 1;
        summary.lastDrink = timestamp; // Full ISO datetime
        if (!summary.firstDrink) {
          summary.firstDrink = timestamp; // Full ISO datetime
        }
      } else {
        // Negative amount (removal) - decrement drinks, DON'T update lastDrink
        summary.numberOfDrinks = Math.max(0, summary.numberOfDrinks - 1);
      }
      
      summary.updatedAt = timestamp; // Use the drink timestamp, not current time
      
      // Save to local cache
      await saveDailySummary(userId, summary);
      console.log('✅ Updated daily summary:', dateStr, summary.totalIntake, 'ml');
      
      // Queue for cloud sync
      await dailySummariesOfflineService.queueSummaryUpdate(userId, dateStr, summary);
      console.log('✅ Queued daily summary for sync:', dateStr);
      
      // Try to sync immediately (same pattern as water intake logs)
      const queueEntry = {
        userId,
        date: dateStr,
        summary,
        queuedAt: new Date().toISOString(),
      };
      
      const syncSuccess = await dailySummariesOfflineService.syncSingleSummary(queueEntry);
      
      if (syncSuccess) {
        // Success! Remove from queue
        await dailySummariesOfflineService.removeSummaryFromQueue(userId, dateStr);
        console.log('✅ Synced daily summary to cloud immediately:', dateStr);
      } else {
        // Failed, but it's queued for retry
        console.log('⚠️ Cloud sync failed for daily summary, queued for retry:', dateStr);
      }
      
    } catch (error) {
      console.error('❌ Error updating daily summary:', error);
      // Don't throw - summary update failing shouldn't break water intake
    }
  }

  /**
   * Sync a single entry to the cloud
   * @param {object} entry - The entry to sync
   * @returns {Promise<object|null>} Cloud document or null if failed
   */
  async syncSingleEntry(entry) {
    try {
      // Ensure amount is an integer (for backwards compatibility with old queue entries)
      const intAmount = Math.round(entry.amount);
      
      const cloudEntry = await waterIntakeAPI.create(
        entry.userId,
        intAmount,
        entry.source,
        entry.timestamp // Pass the original timestamp
      );
      
      console.log('Successfully synced entry to cloud:', cloudEntry.$id);
      return cloudEntry;
    } catch (error) {
      // Check if it's a network error (offline) vs actual error
      const isNetworkError = error.message?.toLowerCase().includes('network') || 
                            error.message?.toLowerCase().includes('fetch');
      
      if (isNetworkError) {
        console.log('⚠️ Offline - entry will sync when connection restored');
      } else {
        console.error('❌ Failed to sync entry to cloud:', error.message);
      }
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

  /**
   * Get today's entries from offline queue
   * @param {string} userId - User ID to filter by
   * @returns {Promise<Array>} Today's offline entries
   */
  async getTodayOfflineEntries(userId) {
    const queue = await this.getOfflineQueue();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    return queue.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entry.userId === userId && entryDate >= todayStart;
    });
  }
}

// Export singleton instance
export const waterIntakeLogsService = new WaterIntakeLogsService();
