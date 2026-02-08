# Smart Water Notification System

## Overview

This notification system sends **conditional reminders** to users based on their actual hydration progress. Unlike traditional daily reminders that fire regardless of user behavior, this system is **smart** - it only bothers users when they're actually behind schedule.

---

## How It Works

### The Core Concept

**Problem**: React Native notifications can't check app state when they fire. You can't schedule a notification that says "fire at 2 PM IF user hasn't drunk enough water" because the notification is pre-scheduled without access to live data.

**Solution**: Instead of pre-scheduling conditional notifications, we **check periodically** and **decide in real-time** whether to send a notification.

### The Three-Tier Checking System

1. **Hourly Checks (Foreground)**
   - When app is open, checks every 60 minutes
   - Low battery impact since app is already running
   - Most reliable method

2. **App State Listener**
   - Triggers check when user opens the app
   - Catches notifications they might have missed
   - Example: User opens app at exactly 2 PM (notification time)

3. **Background Task (Optional/Future)**
   - Checks even when app is completely closed
   - Requires additional setup (expo-background-fetch)
   - Trade-off: battery life vs coverage

---

## Notification Schedule & Thresholds

The system checks at **3 specific times** per day:

| Time         | Threshold | Logic                                                     |
| ------------ | --------- | --------------------------------------------------------- |
| **10:00 AM** | 0%        | Always remind if ANY water is needed (morning kickstart)  |
| **2:00 PM**  | 30%       | Only remind if user has drunk less than 30% of daily goal |
| **6:00 PM**  | 60%       | Only remind if user has drunk less than 60% of daily goal |

### Example Scenarios

**Scenario 1: User is on track** 🎯

- Daily goal: 3000ml (3L)
- Current time: 2:00 PM
- Current intake: 1000ml
- Progress: (1000 / 3000) × 100 = **33.3%**
- Threshold at 2 PM: 30%
- **Result**: 33.3% > 30% → ✅ **NO notification** (user is doing great!)

**Scenario 2: User is behind** 📉

- Daily goal: 3000ml (3L)
- Current time: 2:00 PM
- Current intake: 700ml
- Progress: (700 / 3000) × 100 = **23.3%**
- Threshold at 2 PM: 30%
- **Result**: 23.3% < 30% → 🔔 **Send notification**
- Message: _"You're behind schedule. 2.3L to go! Time for a water break! 🚰"_

**Scenario 3: User is way behind** 🚨

- Daily goal: 3000ml (3L)
- Current time: 6:00 PM
- Current intake: 500ml
- Progress: (500 / 3000) × 100 = **16.7%**
- Threshold at 6 PM: 60%
- **Result**: 16.7% < 60% → 🔔 **Send urgent notification**
- Message: _"You've barely started! You still need 2.5L today. Let's drink some water! 💧"_

---

## Code Architecture

### 1. Notification Service (`services/notifications.ts`)

**Core Functions:**

```typescript
// Check if notification should be sent based on progress
shouldSendNotification(currentIntake, dailyGoal, currentHour)
  → Returns: { shouldSend: boolean, message: string }

// Send immediate notification
sendWaterReminder(customMessage)

// Main function called by scheduler
checkAndSendNotification(currentIntake, dailyGoal)
```

**Key Features:**

- ✅ Calculates progress percentage
- ✅ Compares against threshold for current hour
- ✅ Generates contextual messages based on progress
- ✅ Respects user's notification settings
- ✅ Prevents duplicate notifications in same hour

### 2. Notification Scheduler (`services/notificationScheduler.ts`)

**Responsibilities:**

- ⏰ Runs periodic checks (every hour)
- 👂 Listens for app state changes
- 🚫 Prevents duplicate notifications
- 💾 Stores last check time

**Key Methods:**

```typescript
// Start the scheduler (call once at app startup)
initialize(getCurrentIntake, getDailyGoal);

// Manual trigger (useful for testing or after water intake)
triggerCheck(getCurrentIntake, getDailyGoal);

// Stop scheduler (when logging out or disabling)
stop();
```

**Duplicate Prevention:**
The scheduler stores the last check time in AsyncStorage. If you already checked at 2:00 PM and user opens the app again at 2:15 PM, it won't send another notification.

### 3. React Hook (`hooks/useNotificationScheduler.ts`)

**Purpose:** Clean React integration

```typescript
// Simply call in your root layout:
useNotificationScheduler();
```

**What it does:**

- Automatically initializes scheduler on mount
- Provides fresh data functions to scheduler
- Cleans up on unmount
- Re-checks when water intake changes

### 4. Settings Integration (`app/(tabs)/settings.tsx`)

**User Controls:**

- Toggle notifications on/off
- Request permissions
- Show explanatory dialog
- Persist settings to AsyncStorage

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        APP STARTUP                          │
│  (app/_layout.tsx calls useNotificationScheduler())        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATION SCHEDULER                         │
│  - Sets up hourly timer (setInterval)                      │
│  - Sets up app state listener (AppState.addEventListener)  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Every hour OR when app opens
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   PERFORM CHECK                             │
│  1. Is it 10, 14, or 18 o'clock? (notification time?)     │
│  2. Did we already check this hour?                        │
│  3. Get current water intake from useUserStore             │
│  4. Get daily goal from useUserStore                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           CALL checkAndSendNotification()                   │
│  1. Calculate progress: (intake / goal) × 100              │
│  2. Get threshold for current hour                         │
│  3. Compare: progress < threshold?                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ├──────> IF progress >= threshold
                      │        → Skip (user is on track)
                      │
                      └──────> IF progress < threshold
                               → Generate contextual message
                               → Send notification
                               → Save last check time
```

---

## Message Generation Logic

The system creates **contextual messages** based on how far behind the user is:

```typescript
if (progress < 10%) {
  "You've barely started! You still need {X}L today. Let's drink some water! 💧"
}
else if (progress < 30%) {
  "You're behind schedule. {X}L to go! Time for a water break! 🚰"
}
else if (progress < 60%) {
  "You need {X}L more. Keep up the hydration! 💪"
}
else {
  "Almost there! Just {X}L left to reach your goal! 🎯"
}
```

**Why contextual messages?**

- More engaging than generic reminders
- Shows the system understands user's situation
- Provides actionable information (specific amount remaining)
- Encourages completion through positive reinforcement

---

## Setup Instructions

### 1. Enable Notifications in Settings

```tsx
// In settings screen:
<ToggleButton
  isToggled={notificationsEnabled}
  onPress={handleNotificationToggle}
/>
```

When user toggles ON:

1. Request notification permission (iOS/Android prompt)
2. Save enabled state to AsyncStorage
3. Show explanatory dialog about notification times
4. Scheduler automatically picks up the change

### 2. Scheduler Initialization

Already done in `app/_layout.tsx`:

```tsx
export default function RootLayout() {
  useNotificationScheduler(); // ← That's it!

  // ... rest of your layout
}
```

### 3. Testing Notifications

**Manual Testing:**

```typescript
// Import in any file
import { notificationScheduler } from "@/services/notificationScheduler";
import { useUserStore } from "@/hooks/useUserStore";

// In a component:
const { totalToday, recommendedIntake } = useUserStore();

// Trigger check manually
notificationScheduler.triggerCheck(
  () => totalToday,
  () => recommendedIntake,
);
```

**Time Travel Testing:**

```typescript
// In notifications.ts, temporarily change hours for testing:
const NOTIFICATION_THRESHOLDS = [
  { time: new Date().getHours(), minProgress: 0 }, // Current hour
  // ...
];
```

**Simulate Low Progress:**

```typescript
// Temporarily modify shouldSendNotification() to force notification:
const progress = 10; // Force low progress for testing
```

---

## Why This Approach?

### ✅ Advantages

1. **User-Friendly**
   - No spam: Users only get reminders when actually needed
   - Contextual messages feel helpful, not nagging
   - Users stay on track without annoyance

2. **Flexible**
   - Easy to adjust thresholds (change percentages)
   - Easy to add/remove notification times
   - Can customize messages per time slot

3. **Reliable**
   - Works when app is open (most common case)
   - Works when app comes to foreground
   - Duplicate prevention built-in

4. **Performant**
   - Only checks at specific hours (not every second)
   - Low battery impact (uses existing app processes)
   - No constant background tasks

5. **Privacy-Conscious**
   - All logic runs locally on device
   - No server calls needed for notifications
   - User data never leaves their phone

### ⚠️ Trade-offs

1. **Requires App Activity**
   - Works best when user opens app periodically
   - True "closed app" notifications need background fetch (optional)
   - For water tracking, users typically open app multiple times daily

2. **Notification Timing**
   - Might send a few minutes after the hour (when check runs)
   - Not exact-second precision (but doesn't matter for daily goals)

3. **System Limitations**
   - iOS can delay background tasks (battery optimization)
   - Android may kill background processes (aggressive power saving)
   - These are React Native limitations, not our implementation

---

## Future Enhancements

### Option 1: True Background Notifications

Add `expo-background-fetch` for notifications when app is completely closed:

```bash
npx expo install expo-task-manager expo-background-fetch
```

**Pros:**

- Works even when app is closed for days
- Better coverage

**Cons:**

- More complex setup
- Battery impact
- iOS unreliable (system decides when to run)
- Android may kill it

**Recommendation:** Only add if user feedback demands it. Most water tracking apps are opened frequently throughout the day.

### Option 2: Customizable Times

Let users choose their own notification times:

```typescript
// In settings:
const [notificationTimes, setNotificationTimes] = useState([
  { hour: 10, minute: 0, threshold: 0 },
  { hour: 14, minute: 0, threshold: 30 },
  { hour: 18, minute: 0, threshold: 60 },
]);

// User can add/remove/edit times
```

### Option 3: Adaptive Thresholds

Learn from user's patterns:

```typescript
// Track when user typically drinks water
// Adjust thresholds based on their habits
// Example: If user always drinks heavily at lunch,
// lower the 2 PM threshold for them
```

### Option 4: Streak Protection

Extra notification if streak is at risk:

```typescript
// At 11 PM:
if (streak >= 7 && progress < 100) {
  sendWaterReminder(
    "Don't break your 🔥 ${streak}-day streak! Just ${remaining}ml left!",
  );
}
```

---

## Troubleshooting

### Notifications not appearing?

**Check 1: Permissions**

```typescript
import * as Notifications from "expo-notifications";
const { status } = await Notifications.getPermissionsAsync();
console.log("Permission status:", status);
```

**Check 2: Settings enabled**

```typescript
import { getNotificationSettings } from "@/services/notifications";
const settings = await getNotificationSettings();
console.log("Notifications enabled:", settings.enabled);
```

**Check 3: Scheduler running**

```typescript
// Add logging in notificationScheduler.ts
console.log("Scheduler initialized:", notificationScheduler.isInitialized);
```

**Check 4: Check time**

```typescript
// Notifications only at 10, 14, 18
const hour = new Date().getHours();
console.log("Current hour:", hour);
console.log("Is notification hour:", [10, 14, 18].includes(hour));
```

### Duplicate notifications?

The system prevents this automatically, but if you see duplicates:

```typescript
// Clear last check time
import AsyncStorage from "@react-native-async-storage/async-storage";
await AsyncStorage.removeItem("last_notification_check");
```

### Testing not working?

```typescript
// Force notification regardless of conditions:
import { sendWaterReminder } from "@/services/notifications";
await sendWaterReminder("Test notification!");
```

---

## Summary

This notification system provides **smart, contextual reminders** that:

1. ✅ Only notify when user is actually behind schedule
2. ✅ Adapt messages to user's current progress
3. ✅ Prevent notification fatigue (no spam)
4. ✅ Work reliably with minimal setup
5. ✅ Respect battery life and system resources

**Key Philosophy:** Better to miss a notification occasionally than to annoy users with unnecessary reminders. Users who are doing well shouldn't be bothered!
