import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { getHealthProfile, getTodaysSummary } from "./storage";

// Storage keys
const NOTIFICATION_SETTINGS_KEY = "notification_settings";
const NOTIFICATION_PROMPT_SHOWN_KEY = "notification_prompt_shown";

// Notification check-in times (24h format)
const NOTIFICATION_TIMES = [
  { hour: 10, minute: 0, label: "morning" }, // Morning check-in
  { hour: 14, minute: 0, label: "afternoon" }, // Afternoon check-in
  { hour: 18, minute: 0, label: "evening" }, // Evening check-in
];

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === "granted";
  }

  return true;
}

// Get current permission status
export async function getNotificationPermissionStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// Save notification settings
export async function saveNotificationSettings(enabled: boolean) {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify({ enabled }),
    );
  } catch (error) {
    console.error("Failed to save notification settings:", error);
  }
}

// Get notification settings
export async function getNotificationSettings() {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
    return { enabled: false };
  } catch (error) {
    console.error("Failed to get notification settings:", error);
    return { enabled: false };
  }
}

// Check if we've shown the notification prompt before
export async function hasShownNotificationPrompt() {
  try {
    const shown = await AsyncStorage.getItem(NOTIFICATION_PROMPT_SHOWN_KEY);
    return shown === "true";
  } catch (error) {
    return false;
  }
}

// Mark that we've shown the notification prompt
export async function markNotificationPromptShown() {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PROMPT_SHOWN_KEY, "true");
  } catch (error) {
    console.error("Failed to mark prompt shown:", error);
  }
}

/**
 * Get current water intake data for building notification messages
 */
async function getIntakeData(): Promise<{
  totalToday: number;
  goal: number;
  percent: number;
  remaining: number;
}> {
  try {
    // Get userId from auth storage
    const authRaw = await AsyncStorage.getItem("auth-storage");
    const authData = authRaw ? JSON.parse(authRaw) : null;
    const userId = authData?.state?.userId;

    let totalToday = 0;
    let goal = 2400; // default

    // Get goal from health profile
    const healthProfile = await getHealthProfile();
    if (healthProfile?.customWaterGoal) {
      goal = healthProfile.customWaterGoal;
    }

    // Get today's intake from daily summary
    if (userId) {
      const summary = await getTodaysSummary(userId);
      if (summary) {
        totalToday = summary.totalIntake;
        if (summary.goalAmount > 0) {
          goal = summary.goalAmount;
        }
      }
    }

    const remaining = Math.max(0, goal - totalToday);
    const percent = Math.min(100, Math.round((totalToday / goal) * 100));

    return { totalToday, goal, percent, remaining };
  } catch (error) {
    console.error("Failed to get intake data for notifications:", error);
    return { totalToday: 0, goal: 2400, percent: 0, remaining: 2400 };
  }
}

/**
 * Build a personalized notification message based on current intake and time of day
 */
function buildNotificationContent(
  label: string,
  totalToday: number,
  goal: number,
  percent: number,
  remaining: number,
): { title: string; body: string } {
  // Format ml values nicely
  const totalStr =
    totalToday >= 1000
      ? `${(totalToday / 1000).toFixed(1)}L`
      : `${totalToday}ml`;
  const remainingStr =
    remaining >= 1000 ? `${(remaining / 1000).toFixed(1)}L` : `${remaining}ml`;
  const goalStr = goal >= 1000 ? `${(goal / 1000).toFixed(1)}L` : `${goal}ml`;

  if (percent >= 100) {
    return {
      title: "🎉 Goal reached!",
      body: `Amazing! You've hit ${totalStr} today — that's ${percent}% of your ${goalStr} goal. Keep it up!`,
    };
  }

  if (label === "morning") {
    if (percent === 0) {
      return {
        title: "☀️ Good morning!",
        body: `Start your day right — you haven't had any water yet. Your goal is ${goalStr} today.`,
      };
    }
    if (percent < 25) {
      return {
        title: "☀️ Morning check-in",
        body: `You're at ${totalStr} (${percent}%). Drink ${remainingStr} more to hit your ${goalStr} goal.`,
      };
    }
    return {
      title: "☀️ Great morning start!",
      body: `Already at ${totalStr} (${percent}%) — keep going, ${remainingStr} left!`,
    };
  }

  if (label === "afternoon") {
    if (percent < 30) {
      return {
        title: "🥤 Time to catch up!",
        body: `You're only at ${totalStr} (${percent}%). Try to drink ${remainingStr} more before the evening.`,
      };
    }
    if (percent < 60) {
      return {
        title: "💧 Afternoon check-in",
        body: `You're at ${totalStr} (${percent}%) — halfway there! ${remainingStr} to go.`,
      };
    }
    return {
      title: "💧 Looking good!",
      body: `${totalStr} so far (${percent}%) — just ${remainingStr} left to hit your goal!`,
    };
  }

  // Evening
  if (percent < 50) {
    return {
      title: "🌙 Evening reminder",
      body: `You're at ${totalStr} (${percent}%). Try to drink ${remainingStr} more before bed to stay hydrated.`,
    };
  }
  if (percent < 80) {
    return {
      title: "🌙 Almost there!",
      body: `${totalStr} down (${percent}%) — just ${remainingStr} more and you've hit your goal!`,
    };
  }
  return {
    title: "🌙 Nearly done!",
    body: `So close! ${totalStr} (${percent}%) — only ${remainingStr} left. Finish strong! 💪`,
  };
}

/**
 * Schedule smart daily notifications with personalized messages
 * based on current intake progress. Call this whenever intake changes
 * or the app comes to the foreground.
 */
export async function scheduleDailyNotifications() {
  // Cancel any existing notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Get current intake data to build smart messages
  const { totalToday, goal, percent, remaining } = await getIntakeData();

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  for (const time of NOTIFICATION_TIMES) {
    // Skip times that have already passed today — they'll fire tomorrow
    // with potentially stale data, so use a generic message for those
    const isPast =
      time.hour < currentHour ||
      (time.hour === currentHour && time.minute <= currentMinute);

    let content: { title: string; body: string };

    if (isPast) {
      // This notification will fire tomorrow — use a generic message
      // (it will be rescheduled with fresh data when the app opens tomorrow)
      content = {
        title:
          time.label === "morning"
            ? "☀️ Morning hydration check"
            : time.label === "afternoon"
              ? "💧 Afternoon hydration check"
              : "🌙 Evening hydration check",
        body: "Check in on your water intake progress!",
      };
    } else {
      // This notification fires today — use personalized message
      content = buildNotificationContent(
        time.label,
        totalToday,
        goal,
        percent,
        remaining,
      );
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: time.hour,
          minute: time.minute,
        },
      });
    } catch (error) {
      console.error(
        `Failed to schedule notification at ${time.hour}:${time.minute}:`,
        error,
      );
    }
  }
}

// Cancel all notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Enable/disable notifications
export async function setNotificationsEnabled(enabled: boolean) {
  if (enabled) {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return false;
    }
    await scheduleDailyNotifications();
  } else {
    await cancelAllNotifications();
  }

  await saveNotificationSettings(enabled);
  return true;
}

/**
 * Refresh notification content with latest intake data.
 * Call this after water intake changes or when app comes to foreground.
 * Only reschedules if notifications are enabled.
 */
export async function refreshNotifications() {
  try {
    const settings = await getNotificationSettings();
    if (settings.enabled) {
      await scheduleDailyNotifications();
    }
  } catch (error) {
    console.error("Failed to refresh notifications:", error);
  }
}
