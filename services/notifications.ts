import * as Notifications from 'expo-notifications';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permissions
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  
  return true;
}

// Schedule a daily reminder at a specific hour
export async function scheduleDailyReminder(hour: number, minute: number = 0) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Stay Hydrated! 💧",
      body: "Don't forget to drink water!",
    },
    trigger: {
      type: 'daily',
      hour,
      minute,
    },
  });
}