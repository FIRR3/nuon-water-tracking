# Notification Setup - Complete ✅

## What's Implemented

Your app now has **simple scheduled notifications** that remind users to drink water **twice a day**:

- **11:00 AM** - Morning reminder
- **5:00 PM** - Evening reminder

### Key Features

✅ **Works even when app is closed** - Notifications fire at scheduled times automatically  
✅ **Simple and reliable** - Uses native iOS/Android notification scheduling  
✅ **No app-opening required** - Once enabled, they just work  
✅ **Easy to enable** - Just toggle in Settings

---

## How Users Enable Notifications

1. Open the app
2. Go to **Settings** tab
3. Toggle **Notifications** ON
4. Grant permission when prompted
5. See confirmation: "You'll receive daily reminders at 11:00 AM and 5:00 PM"

That's it! The notifications are now scheduled and will fire every day automatically.

---

## How It Works (Technical)

### When User Enables Notifications:

```typescript
// In settings.tsx, when toggle is turned ON:
setNotificationsEnabled(true)
  ↓
// In notifications.ts:
1. Request notification permissions
2. Call scheduleDailyReminders()
3. Schedule two repeating notifications:
   - One at 11:00 AM daily
   - One at 5:00 PM daily
4. Save enabled state to AsyncStorage
```

### The Notification Trigger:

```typescript
trigger: {
  hour: 11,        // 11 AM
  minute: 0,       // At :00
  repeats: true,   // 🔑 This makes it repeat every day
}
```

The `repeats: true` is the magic - it tells the OS to fire this notification every day at the specified time, no app interaction needed!

### When User Disables Notifications:

```typescript
setNotificationsEnabled(false)
  ↓
cancelAllNotifications()  // Removes all scheduled notifications
```

---

## Testing Notifications

### Test Immediately (Without Waiting):

```typescript
// Add this to any component temporarily:
import { sendWaterReminder } from "@/services/notifications";

// Trigger immediately:
await sendWaterReminder("Test notification!");
```

### Test Scheduled Notifications:

```typescript
// Check what's scheduled:
import { getScheduledNotifications } from "@/services/notifications";

const scheduled = await getScheduledNotifications();
console.log(scheduled); // Shows all scheduled notifications
```

### Test on Real Device:

1. Enable notifications in Settings
2. Close the app completely
3. Change device time to 10:59 AM
4. Wait 1 minute → Should see notification at 11:00 AM

---

## Customizing Notification Times

Want different times? Easy! Just edit this in `services/notifications.ts`:

```typescript
const DEFAULT_NOTIFICATION_TIMES = [
  { hour: 11, minute: 0 }, // Morning - change to any hour (0-23)
  { hour: 17, minute: 0 }, // Evening - change to any hour (0-23)
];
```

Want 3 notifications per day? Add another:

```typescript
const DEFAULT_NOTIFICATION_TIMES = [
  { hour: 9, minute: 0 }, // Morning
  { hour: 14, minute: 0 }, // Afternoon
  { hour: 19, minute: 0 }, // Evening
];
```

---

## Troubleshooting

### Notifications not appearing?

**1. Check permissions:**

```typescript
import * as Notifications from "expo-notifications";
const { status } = await Notifications.getPermissionsAsync();
console.log("Permission:", status); // Should be "granted"
```

**2. Check if notifications are scheduled:**

```typescript
import { getScheduledNotifications } from "@/services/notifications";
const scheduled = await getScheduledNotifications();
console.log("Scheduled:", scheduled.length); // Should be 2
```

**3. Check device settings:**

- iOS: Settings → [Your App] → Notifications → Make sure enabled
- Android: Settings → Apps → [Your App] → Notifications → Make sure enabled

**4. Test with immediate notification:**

```typescript
import { sendWaterReminder } from "@/services/notifications";
await sendWaterReminder("Test!"); // Should appear immediately
```

### Re-enable after issues:

```typescript
// In Settings, toggle OFF then ON again
// This will:
// 1. Cancel all old notifications
// 2. Request permissions fresh
// 3. Schedule new notifications
```

---

## iOS Considerations

On iOS, notifications require:

- User permission (handled automatically)
- App must be installed (can't be deleted)
- Device must be on (notifications won't queue forever)

**Note:** iOS may batch notifications if device is in Low Power Mode or Do Not Disturb.

---

## Android Considerations

On Android:

- Works with all Android versions
- Respects Do Not Disturb settings
- Shows in notification drawer
- May be auto-cleared by user's notification settings

---

## What's NOT Needed

❌ You DON'T need expo-background-fetch  
❌ You DON'T need expo-task-manager  
❌ You DON'T need the app to be running  
❌ You DON'T need complex background tasks

The native notification system handles everything!

---

## Summary

**Setup Status:** ✅ **COMPLETE**

**What you have:**

- Simple, reliable daily notifications
- Works even when app is closed
- Easy user control via Settings
- No complex background tasks needed

**What users need to do:**

1. Toggle Notifications ON in Settings
2. Grant permission
3. Done! They'll get reminders at 11 AM and 5 PM daily

**What YOU need to do:**

- Nothing! It's all set up and ready to go 🎉
