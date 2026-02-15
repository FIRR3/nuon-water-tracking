// services/offlineEditsService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { healthProfileAPI, userProfileAPI } from './appwriteService';
import { saveHealthProfile, saveUserProfile } from './storage';

const OFFLINE_EDITS_QUEUE_KEY = '@offline_edits_queue';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

/**
 * Offline Edits Service
 * Handles reliable storage of user profile and health profile edits with automatic cloud sync
 * Similar to waterIntakeLogsService but for user data
 */
export class OfflineEditsService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = new Set();
  }

  /**
   * Add a sync listener
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
   * Queue an edit to user profile
   * @param {string} userId - User ID
   * @param {object} updates - Profile updates
   */
  async queueUserProfileEdit(userId, updates) {
    const edit = {
      type: 'user_profile',
      userId,
      data: updates,
      timestamp: new Date().toISOString(),
      localId: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
    };

    try {
      // Save to local cache immediately
      const currentProfile = await AsyncStorage.getItem('@user_profile');
      if (currentProfile) {
        const profile = JSON.parse(currentProfile);
        const updatedProfile = { ...profile, ...updates };
        await saveUserProfile(updatedProfile);
      }

      // Add to offline queue
      await this.addToQueue(edit);

      // Try to sync immediately
      const success = await this.syncSingleEdit(edit);
      
      if (success) {
        await this.removeFromQueue(edit.localId);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error queuing user profile edit:', error);
      throw error;
    }
  }

  /**
   * Queue an edit to health profile
   * @param {string} userId - User ID
   * @param {object} updates - Health profile updates
   */
  async queueHealthProfileEdit(userId, updates) {
    const edit = {
      type: 'health_profile',
      userId,
      data: updates,
      timestamp: new Date().toISOString(),
      localId: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
    };

    try {
      // Save to local cache immediately
      const currentProfile = await AsyncStorage.getItem('@health_profile');
      if (currentProfile) {
        const profile = JSON.parse(currentProfile);
        const updatedProfile = { ...profile, ...updates };
        await saveHealthProfile(updatedProfile);
      }

      // Add to offline queue
      await this.addToQueue(edit);

      // Try to sync immediately
      const success = await this.syncSingleEdit(edit);
      
      if (success) {
        await this.removeFromQueue(edit.localId);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error queuing health profile edit:', error);
      throw error;
    }
  }

  /**
   * Sync a single edit to the cloud
   * @param {object} edit - The edit to sync
   * @returns {Promise<boolean>} Success status
   */
  async syncSingleEdit(edit) {
    try {
      if (edit.type === 'user_profile') {
        await userProfileAPI.update(edit.userId, edit.data);
        return true;
      } else if (edit.type === 'health_profile') {
        await healthProfileAPI.updateByUserId(edit.userId, edit.data);
        return true;
      }
      return false;
    } catch (error) {
      // Check if it's a network error (offline) vs actual error
      const isNetworkError = error.message?.toLowerCase().includes('network') || 
                            error.message?.toLowerCase().includes('fetch');
      
      if (isNetworkError) {
      } else {
        console.error('❌ Failed to sync edit to cloud:', error.message);
      }
      return false;
    }
  }

  /**
   * Add edit to queue
   * @param {object} edit - Edit to add
   */
  async addToQueue(edit) {
    try {
      const queue = await this.getQueue();
      queue.push(edit);
      await AsyncStorage.setItem(OFFLINE_EDITS_QUEUE_KEY, JSON.stringify(queue));
      this.notifySyncListeners('queued', queue.length);
    } catch (error) {
      console.error('Error adding to offline queue:', error);
      throw error;
    }
  }

  /**
   * Get offline queue
   * @returns {Promise<Array>} Queue edits
   */
  async getQueue() {
    try {
      const queueJson = await AsyncStorage.getItem(OFFLINE_EDITS_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  /**
   * Remove edit from queue
   * @param {string} localId - Local ID of edit to remove
   */
  async removeFromQueue(localId) {
    try {
      const queue = await this.getQueue();
      const newQueue = queue.filter(edit => edit.localId !== localId);
      await AsyncStorage.setItem(OFFLINE_EDITS_QUEUE_KEY, JSON.stringify(newQueue));
      this.notifySyncListeners('synced', newQueue.length);
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }

  /**
   * Update retry count for an edit
   * @param {string} localId - Local ID of edit
   */
  async incrementRetryCount(localId) {
    try {
      const queue = await this.getQueue();
      const edit = queue.find(e => e.localId === localId);
      if (edit) {
        edit.retryCount = (edit.retryCount || 0) + 1;
        edit.lastRetryAt = new Date().toISOString();
        await AsyncStorage.setItem(OFFLINE_EDITS_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Error updating retry count:', error);
    }
  }

  /**
   * Sync all offline edits to cloud
   * @returns {Promise<{synced: number, failed: number}>} Sync results
   */
  async syncOfflineQueue() {
    if (this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifySyncListeners('syncing', 0);

    try {
      const queue = await this.getQueue();
      
      if (queue.length === 0) {
        this.notifySyncListeners('idle', 0);
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;

      for (const edit of queue) {
        // Skip if retried too many times
        if (edit.retryCount >= MAX_RETRY_ATTEMPTS) {
          failed++;
          continue;
        }

        const success = await this.syncSingleEdit(edit);
        
        if (success) {
          await this.removeFromQueue(edit.localId);
          synced++;
        } else {
          await this.incrementRetryCount(edit.localId);
          failed++;
          // Add delay between retries
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }

      const remainingQueue = await this.getQueue();
      this.notifySyncListeners(remainingQueue.length > 0 ? 'idle' : 'synced', remainingQueue.length);

      return { synced, failed };
    } catch (error) {
      console.error('Error syncing offline queue:', error);
      const queue = await this.getQueue();
      this.notifySyncListeners('error', queue.length);
      return { synced: 0, failed: queue.length };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get count of pending offline edits
   * @returns {Promise<number>} Count of pending edits
   */
  async getPendingCount() {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Clear all offline edits (use with caution!)
   */
  async clearQueue() {
    try {
      await AsyncStorage.removeItem(OFFLINE_EDITS_QUEUE_KEY);
      this.notifySyncListeners('idle', 0);
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }

  /**
   * Get failed edits that need attention
   * @returns {Promise<Array>} Failed edits
   */
  async getFailedEdits() {
    const queue = await this.getQueue();
    return queue.filter(edit => edit.retryCount >= MAX_RETRY_ATTEMPTS);
  }
}

// Export singleton instance
export const offlineEditsService = new OfflineEditsService();
