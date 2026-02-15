// services/dailySummariesAPI.js
import { ID, Query } from "appwrite";
import { databases } from "./appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const DAILY_SUMMARIES_TABLE_ID = process.env.EXPO_PUBLIC_APPWRITE_DAILY_SUMMARIES_TABLE_ID;

/**
 * Daily Summaries API
 * Handles CRUD operations for daily water intake summaries
 */
export const dailySummariesAPI = {
  /**
   * Get today's summary for a user
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Daily summary or null
   */
  async getToday(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await this.getByDate(userId, today.toISOString());
  },

  /**
   * Get summary for specific date
   * @param {string} userId - User ID
   * @param {string} date - ISO datetime string
   * @returns {Promise<object|null>} Daily summary or null
   */
  async getByDate(userId, date) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        DAILY_SUMMARIES_TABLE_ID,
        [
          Query.equal("user", userId),
          Query.equal("date", date),
        ]
      );
      return response.documents[0] || null;
    } catch (error) {
      console.error('Error fetching daily summary by date:', error);
      throw error;
    }
  },

  /**
   * Get summaries for date range
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of daily summaries
   */
  async getDateRange(userId, startDate, endDate) {
    try {
      // Set to midnight for proper datetime comparison
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const response = await databases.listDocuments(
        DATABASE_ID,
        DAILY_SUMMARIES_TABLE_ID,
        [
          Query.equal("user", userId),
          Query.greaterThanEqual("date", start.toISOString()),
          Query.lessThanEqual("date", end.toISOString()),
          Query.orderDesc("date"),
        ]
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching daily summaries range:', error);
      throw error;
    }
  },

  /**
   * Create new daily summary
   * @param {string} userId - User ID
   * @param {object} data - Summary data
   * @returns {Promise<object>} Created summary
   */
  async create(userId, data) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        DAILY_SUMMARIES_TABLE_ID,
        ID.unique(),
        {
          user: userId,
          date: data.date, // ISO datetime string
          totalIntake: data.totalIntake || 0,
          goalAmount: data.goalAmount || 2400,
          numberOfDrinks: data.numberOfDrinks || 0,
          firstDrink: data.firstDrink || null, // ISO datetime string or null
          lastDrink: data.lastDrink || null, // ISO datetime string or null
        }
      );
    } catch (error) {
      console.error('Error creating daily summary:', error);
      throw error;
    }
  },

  /**
   * Update existing daily summary
   * @param {string} summaryId - Summary document ID
   * @param {object} data - Data to update
   * @returns {Promise<object>} Updated summary
   */
  async update(summaryId, data) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        DAILY_SUMMARIES_TABLE_ID,
        summaryId,
        data
      );
    } catch (error) {
      console.error('Error updating daily summary:', error);
      throw error;
    }
  },

  /**
   * Upsert (create or update) daily summary
   * Main function used when adding water
   * @param {string} userId - User ID
   * @param {string} date - ISO datetime string (midnight)
   * @param {object} updates - Updates to apply
   * @returns {Promise<object>} Created or updated summary
   */
  async upsert(userId, date, updates) {
    try {
      // Try to get existing summary
      const existing = await this.getByDate(userId, date);
      
      if (existing) {
        // Try to update existing
        try {
          return await this.update(existing.$id, updates);
        } catch (updateError) {
          // If document not found (stale ID), create new
          if (updateError.code === 404 || updateError.message?.includes('could not be found')) {
            return await this.create(userId, {
              date,
              ...updates,
            });
          }
          throw updateError;
        }
      } else {
        // Create new
        return await this.create(userId, {
          date,
          ...updates,
        });
      }
    } catch (error) {
      console.error('Error upserting daily summary:', error);
      throw error;
    }
  },

  /**
   * Delete a daily summary
   * @param {string} summaryId - Summary document ID
   * @returns {Promise<void>}
   */
  async delete(summaryId) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        DAILY_SUMMARIES_TABLE_ID,
        summaryId
      );
    } catch (error) {
      console.error('Error deleting daily summary:', error);
      throw error;
    }
  },
};
