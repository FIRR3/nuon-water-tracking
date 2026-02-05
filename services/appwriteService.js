import { ID, Query } from 'appwrite';
import { account, databases } from './appwrite'; // Your Appwrite config

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;;

// ============= USER PROFILE =============
export const userProfileAPI = {
  async get(userId) {
    return await databases.getDocument(DATABASE_ID, 'users', userId);
  },

  async update(userId, data) {
    return await databases.updateDocument(DATABASE_ID, 'users', userId, data);
  },

  async delete(userId) {
    return await databases.deleteDocument(DATABASE_ID, 'users', userId);
  }
};

// ============= USER HEALTH PROFILE =============
export const healthProfileAPI = {
  async getByUserId(userId) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'user_health_profiles',
      [Query.equal('user', userId)]
    );
    return response.documents[0] || null;
  },

  async create(userId, data) {
    return await databases.createDocument(
      DATABASE_ID,
      'user_health_profiles',
      ID.unique(),
      {
        user: userId,
        ...data
      }
    );
  },

  async update(profileId, data) {
    return await databases.updateDocument(
      DATABASE_ID,
      'user_health_profiles',
      profileId,
      data
    );
  },

  async updateByUserId(userId, data) {
    const profile = await this.getByUserId(userId);
    if (!profile) throw new Error('Health profile not found');
    return await this.update(profile.$id, data);
  },

  async delete(profileId) {
    return await databases.deleteDocument(
      DATABASE_ID,
      'user_health_profiles',
      profileId
    );
  }
};

// ============= WATER INTAKE LOGS =============
export const waterIntakeAPI = {
  async create(userId, amount, source = 'bluetooth', timestamp = null) {
    const now = new Date().toISOString();
    return await databases.createDocument(
      DATABASE_ID,
      'water_intake_logs',
      ID.unique(),
      {
        user: userId,
        amount,
        timestamp: timestamp || now,
        source,
        syncedAt: now
      }
    );
  },

  async getToday(userId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const response = await databases.listDocuments(
      DATABASE_ID,
      'water_intake_logs',
      [
        Query.equal('user', userId),
        Query.greaterThanEqual('timestamp', todayStart.toISOString()),
        Query.lessThan('timestamp', tomorrowStart.toISOString()),
        Query.orderDesc('timestamp'),
        Query.limit(100)
      ]
    );
    return response.documents;
  },

  async getDateRange(userId, startDate, endDate) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'water_intake_logs',
      [
        Query.equal('user', userId),
        Query.greaterThanEqual('timestamp', startDate.toISOString()),
        Query.lessThan('timestamp', endDate.toISOString()),
        Query.orderAsc('timestamp'),
        Query.limit(1000)
      ]
    );
    return response.documents;
  },

  async delete(logId) {
    return await databases.deleteDocument(
      DATABASE_ID,
      'water_intake_logs',
      logId
    );
  }
};

// ============= DAILY SUMMARIES =============
export const dailySummaryAPI = {
  async get(userId, date) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const docId = `${userId}_${dateStr}`;
    
    try {
      return await databases.getDocument(DATABASE_ID, 'daily_summaries', docId);
    } catch (error) {
      return null; // Doesn't exist yet
    }
  },

  async upsert(userId, date, data) {
    const dateStr = date.toISOString().split('T')[0];
    const docId = `${userId}_${dateStr}`;
    
    try {
      // Try to update existing
      return await databases.updateDocument(
        DATABASE_ID,
        'daily_summaries',
        docId,
        data
      );
    } catch (error) {
      // Create new if doesn't exist
      return await databases.createDocument(
        DATABASE_ID,
        'daily_summaries',
        docId,
        {
          user: userId,
          date: date.toISOString(),
          ...data
        }
      );
    }
  },

  async getWeek(userId, startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const response = await databases.listDocuments(
      DATABASE_ID,
      'daily_summaries',
      [
        Query.equal('user', userId),
        Query.greaterThanEqual('date', startDate.toISOString()),
        Query.lessThan('date', endDate.toISOString()),
        Query.orderAsc('date')
      ]
    );
    return response.documents;
  }
};

// ============= AUTH HELPERS =============
export const authAPI = {
  async getCurrentUser() {
    return await account.get();
  },

  async logout() {
    return await account.deleteSession('current');
  }
};