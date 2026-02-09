import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

// Storage keys
const NOTIFICATION_SETTINGS_KEY = "notification_settings";
const NOTIFICATION_PROMPT_SHOWN_KEY = "notification_prompt_shown";

// Notification times (24h format)
const NOTIFICATION_TIMES = [
  { hour: 10, minute: 0 }, // Morning
  { hour: 14, minute: 0 }, // Mid day
  { hour: 18, minute: 0 }, // Evening
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

// Schedule daily notifications
export async function scheduleDailyNotifications() {
  // Cancel any existing notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const time of NOTIFICATION_TIMES) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hydration Reminder",
          body: "Remember to drink water and track your progress",
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
