// utils/dailySummaryMaintenance.js
import { dailySummariesAPI, waterIntakeAPI } from '../services/appwriteService';
import { clearOldDailySummaries, getDailySummary, saveDailySummary } from '../services/storage';

/**
 * Daily Summary Maintenance Utilities
 * Handles background tasks for summary management
 */

/**
 * Create a new daily summary for today at midnight (or when app opens)
 * Creates summary with 0 values - will be updated when water is added
 * @param {string} userId - User ID
 * @param {number} currentGoal - User's current water goal
 * @returns {Promise<object>} Created summary
 */
export const createTodaysSummary = async (userId, currentGoal) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    // Check if summary already exists
    const existing = await getDailySummary(userId, todayStr);
    if (existing) {
      console.log('✅ Today\'s summary already exists');
      return existing;
    }
    
    const timestamp = new Date().toISOString();
    
    // Create new summary with 0 values
    const newSummary = {
      userId,
      date: todayStr, // ISO datetime (midnight)
      totalIntake: 0,
      goalAmount: currentGoal,
      numberOfDrinks: 0,
      firstDrink: null,
      lastDrink: null,
      updatedAt: timestamp,
    };
    
    // Save to local cache
    await saveDailySummary(userId, newSummary);
    
    // Try to create in cloud
    try {
      const cloudSummary = await dailySummariesAPI.create(userId, newSummary);
      console.log('✅ Created today\'s summary in cloud');
      
      // Update cache with cloud ID
      newSummary.$id = cloudSummary.$id;
      await saveDailySummary(userId, newSummary);
      
      return cloudSummary;
    } catch (error) {
      console.log('⚠️ Could not create summary in cloud, saved locally');
      return newSummary;
    }
    
  } catch (error) {
    console.error('❌ Error creating today\'s summary:', error);
    throw error;
  }
};

/**
 * Check if it's past midnight and create new summary if needed
 * Should be called on app launch and periodically
 * @param {string} userId - User ID
 * @param {number} currentGoal - User's current water goal
 */
export const checkAndCreateMidnightSummary = async (userId, currentGoal) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    const summary = await getDailySummary(userId, todayStr);
    
    if (!summary) {
      console.log('🌙 Creating new summary for today (midnight rollover)');
      await createTodaysSummary(userId, currentGoal);
    }
  } catch (error) {
    console.error('Error in midnight summary check:', error);
  }
};

/**
 * Cleanup old summaries from local cache
 * Keeps last 30 days by default
 * @param {number} daysToKeep - Number of days to keep
 */
export const performSummaryCleanup = async (daysToKeep = 30) => {
  try {
    console.log(`🧹 Cleaning up summaries older than ${daysToKeep} days`);
    await clearOldDailySummaries(daysToKeep);
    console.log('✅ Summary cleanup complete');
  } catch (error) {
    console.error('Error cleaning up summaries:', error);
  }
};

/**
 * Schedule periodic checks (called from app root)
 * Checks for midnight rollover every hour
 * @param {string} userId - User ID  
 * @param {Function} getCurrentGoal - Function to get current goal
 * @returns {Function} Cleanup function to stop interval
 */
export const scheduleMidnightCheck = (userId, getCurrentGoal) => {
  // Check immediately on launch
  checkAndCreateMidnightSummary(userId, getCurrentGoal());
  
  // Then check every hour
  const intervalId = setInterval(() => {
    checkAndCreateMidnightSummary(userId, getCurrentGoal());
  }, 60 * 60 * 1000); // Every hour
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Verify and fix daily summary to match actual water intake logs
 * Recalculates summary from logs if mismatch is found
 * @param {string} userId - User ID
 * @param {string} date - ISO datetime string (midnight)
 * @param {number} currentGoal - User's current water goal
 * @returns {Promise<object|null>} Updated summary or null
 */
export const verifyAndFixDailySummary = async (userId, date, currentGoal) => {
  try {
    // Get the date at midnight
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const midnightStr = dateObj.toISOString();
    
    // Get the end of day
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Fetch all logs for this date
    const logs = await waterIntakeAPI.getDateRange(userId, dateObj, endOfDay);
    
    // Calculate correct values from logs
    const correctTotalIntake = logs.reduce((sum, log) => sum + log.amount, 0);
    const correctNumberOfDrinks = logs.length;
    const correctFirstDrink = logs.length > 0 ? logs[logs.length - 1].timestamp : null; // oldest
    const correctLastDrink = logs.length > 0 ? logs[0].timestamp : null; // newest (reversed order)
    
    // Get existing summary
    const existingSummary = await getDailySummary(userId, midnightStr);
    
    // Check if summary needs updating
    const needsUpdate = !existingSummary || 
      existingSummary.totalIntake !== correctTotalIntake ||
      existingSummary.numberOfDrinks !== correctNumberOfDrinks;
    
    if (needsUpdate) {
      console.log(`🔧 Fixing daily summary for ${midnightStr}`);
      console.log(`   Was: ${existingSummary?.totalIntake || 0}ml, ${existingSummary?.numberOfDrinks || 0} drinks`);
      console.log(`   Now: ${correctTotalIntake}ml, ${correctNumberOfDrinks} drinks`);
      
      // Create corrected summary
      const correctedSummary = {
        userId,
        date: midnightStr,
        totalIntake: correctTotalIntake,
        goalAmount: currentGoal,
        numberOfDrinks: correctNumberOfDrinks,
        firstDrink: correctFirstDrink,
        lastDrink: correctLastDrink,
        updatedAt: new Date().toISOString(),
      };
      
      // Save locally
      await saveDailySummary(userId, correctedSummary);
      
      // Update cloud
      try {
        let cloudSummary;
        if (existingSummary?.$id) {
          // Update existing
          cloudSummary = await dailySummariesAPI.update(existingSummary.$id, {
            totalIntake: correctTotalIntake,
            goalAmount: currentGoal,
            numberOfDrinks: correctNumberOfDrinks,
            firstDrink: correctFirstDrink,
            lastDrink: correctLastDrink,
          });
        } else {
          // Create new
          cloudSummary = await dailySummariesAPI.create(userId, correctedSummary);
        }
        
        console.log('✅ Daily summary fixed in cloud');
        
        // Update cache with cloud ID
        correctedSummary.$id = cloudSummary.$id;
        await saveDailySummary(userId, correctedSummary);
        
        return cloudSummary;
      } catch (error) {
        console.log('⚠️ Could not update summary in cloud, saved locally');
        return correctedSummary;
      }
    } else {
      console.log(`✅ Daily summary already correct for ${midnightStr}`);
      return existingSummary;
    }
    
  } catch (error) {
    console.error('❌ Error verifying daily summary:', error);
    return null;
  }
};

/**
 * Verify and fix summaries for a date range
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} currentGoal - User's current water goal
 * @returns {Promise<number>} Number of summaries fixed
 */
export const verifyAndFixDateRange = async (userId, startDate, endDate, currentGoal) => {
  let fixedCount = 0;
  
  try {
    console.log('🔍 Verifying summaries from', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);
    
    // Check each day in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const midnight = new Date(d);
      midnight.setHours(0, 0, 0, 0);
      
      const result = await verifyAndFixDailySummary(userId, midnight.toISOString(), currentGoal);
      if (result) {
        fixedCount++;
      }
    }
    
    console.log(`✅ Verified ${fixedCount} summaries`);
    return fixedCount;
    
  } catch (error) {
    console.error('Error verifying date range:', error);
    return fixedCount;
  }
};
