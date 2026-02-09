# Notification System

## Overview

The app now has a clean, simple notification system that sends daily reminders at 11 AM and 5 PM.

## Files

- **services/notifications.ts** - Main notification service (clean, ~130 lines)
- **app/(tabs)/\_layout.tsx** - First-login prompt
- **app/(tabs)/settings.tsx** - Notification toggle

## Features

### 1. Daily Scheduled Notifications

- Morning reminder: 11:00 AM
- Evening reminder: 5:00 PM
- Messages: "Hydration Reminder - Remember to drink water and track your progress"

### 2. First-Login Prompt

- Shows when user first launches the app after onboarding
- Simple dialog asking if they want to enable reminders
- Marks prompt as shown so it doesn't appear again
- Located in `app/(tabs)/_layout.tsx`

### 3. Settings Toggle

- Clean toggle in Settings → Daily Reminders
- Handles permission requests automatically
- Shows clear, professional messages (no excessive emojis)
- Located in `app/(tabs)/settings.tsx`

## Key Functions

### notifications.ts

```typescript
// Request iOS notification permissions
requestNotificationPermissions()

// Get current permission status
getNotificationPermissionStatus()

// Save/retrieve settings from AsyncStorage
saveNotificationSettings(enabled: boolean)
getNotificationSettings()

// Track if first-login prompt was shown
hasShownNotificationPrompt()
markNotificationPromptShown()

// Schedule notifications at 11 AM and 5 PM daily
scheduleDailyNotifications()

// Remove all scheduled notifications
cancelAllNotifications()

// Main toggle function - handles permissions and scheduling
setNotificationsEnabled(enabled: boolean)
```

## Testing

1. **Fresh Install**: Uninstall the app, rebuild, and install. You should see the first-login prompt after onboarding.
2. **Permission Request**: Toggle notifications in settings to test the permission flow.
3. **Scheduled Notifications**: Enable notifications and wait for 11 AM or 5 PM to verify they fire correctly.

## iOS Configuration

The app's Info.plist includes:

```xml
<key>NSUserNotificationsUsageDescription</key>
<string>We need permission to send you water intake reminders throughout the day to help you stay hydrated.</string>
```

This is **required** for iOS to show the permission dialog.

## Removed

- ❌ Complex conditional notification logic (based on hydration %)
- ❌ Background task scheduler
- ❌ Test notification functions
- ❌ Debug tools section in settings
- ❌ sendWaterReminder function
- ❌ debugNotifications function
- ❌ Excessive emoji usage in messages
- ❌ notificationScheduler.ts
- ❌ notificationTests.ts
- ❌ useNotificationScheduler.ts hook

## Clean Architecture

- Single source of truth: `notifications.ts`
- Simple daily triggers (no complex time-based calculations)
- Clear separation of concerns
- Professional user-facing messages
- Minimal dependencies
