# 🐛 Notification Troubleshooting Guide

## Your Issue: Console says notification sent, but nothing appears

This is a **very common issue** with React Native/Expo notifications. Let's fix it!

---

## 🔍 Step 1: Run the Debug Function

Add this to any component (like your home screen):

```typescript
import { useEffect } from "react";
import { debugNotifications } from "@/services/notifications";

// In your component:
useEffect(() => {
  debugNotifications();
}, []);
```

Or use the test function:

```typescript
import { testDebugNotifications } from "@/services/notificationTests";

// Call it:
testDebugNotifications();
```

**Check the console output** - it will tell you exactly what's wrong!

---

## 🎯 Common Issues & Solutions

### Issue 1: Permission Not Granted ❌

**Symptoms:**

- Console shows: `Permission status: denied` or `undetermined`

**Solution:**

1. **iOS**: Go to Settings → [Your App] → Notifications → Enable "Allow Notifications"
2. **Android**: Go to Settings → Apps → [Your App] → Notifications → Enable

**In Development (Expo Go):**

- Delete the app completely
- Reinstall it
- When permission prompt appears, tap "Allow"

---

### Issue 2: App in Foreground 📱

**Symptoms:**

- Notification "sent successfully" but nothing appears
- App is currently open and active

**Why:**
When your app is **in the foreground**, notifications may appear differently:

- iOS: May show as a **banner at the top** (very subtle!)
- Android: May show in **notification drawer** only

**Solution - Test with app in BACKGROUND:**

1. Run this code to send a test notification:

```typescript
import { testNotificationIn1Minute } from "@/services/notificationTests";
testNotificationIn1Minute(); // Schedules notification in 1 minute
```

2. **Close the app** (swipe up on iOS, press home on Android)
3. Wait 1 minute
4. Notification should appear!

---

### Issue 3: iOS Simulator Issues 🍎

**Symptoms:**

- Testing on iOS Simulator
- Notifications never appear

**Solution:**

- iOS Simulator **doesn't support push notifications properly**
- Test on a **real iOS device** or use Expo Go on real device

---

### Issue 4: Silent Mode / Do Not Disturb 🔕

**Symptoms:**

- Notification sent but no sound/vibration
- May appear in notification center but you didn't notice

**Solution:**

- Check if phone is in silent mode
- Check if Do Not Disturb is enabled
- Try with volume up and ringer on

---

### Issue 5: Notification Channel (Android) 📢

**Symptoms:**

- Android notifications not appearing
- Permissions granted but still nothing

**Solution:**
The notification handler might need Android channel setup. Add this to your app:

```typescript
// In app/_layout.tsx or notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Set up Android notification channel
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });
}
```

---

## 🧪 Quick Tests

### Test 1: Immediate Notification (App in Background)

```typescript
import { sendWaterReminder } from "@/services/notifications";

// 1. Run this:
await sendWaterReminder("TEST from background!");

// 2. Immediately press home button (close app)
// 3. Notification should appear within 1-2 seconds
```

### Test 2: Scheduled Notification

```typescript
import { testNotificationIn1Minute } from "@/services/notificationTests";

// 1. Run this:
await testNotificationIn1Minute();

// 2. Close the app completely
// 3. Wait 60 seconds
// 4. Notification should appear!
```

### Test 3: Check Permissions Manually

```typescript
import * as Notifications from "expo-notifications";

const { status } = await Notifications.getPermissionsAsync();
console.log("Permission:", status); // MUST be "granted"

// If not granted, request:
const { status: newStatus } = await Notifications.requestPermissionsAsync({
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
});
console.log("New status:", newStatus);
```

---

## 📱 Platform-Specific Notes

### iOS Development:

1. **Expo Go**: Notifications work but may be delayed
2. **Development Build**: Full notification support
3. **TestFlight/Production**: Full notification support

**Common iOS issue:**

- Notifications appear as **thin banner at top** when app is foreground
- They disappear quickly (2-3 seconds)
- To see them better, close the app and test

### Android Development:

1. **Permissions**: Usually auto-granted in development
2. **Sound**: May not play in some Android versions in debug mode
3. **Channels**: Required for Android 8.0+

---

## 🎯 The Ultimate Test

Run this complete test sequence:

```typescript
import {
  debugNotifications,
  sendWaterReminder,
} from "@/services/notifications";

async function completeTest() {
  console.log("🔍 Step 1: Debug");
  await debugNotifications();

  console.log("\n⏰ Step 2: Schedule for 5 seconds from now");
  setTimeout(async () => {
    await sendWaterReminder("This should appear in 5 seconds!");
  }, 5000);

  console.log("⏰ Wait 5 seconds and CLOSE THE APP NOW!");
  console.log("📱 Check if notification appears...");
}

completeTest();
```

**What to do:**

1. Run this code
2. **Immediately close the app** (don't wait for console logs to finish)
3. Count to 10
4. Check if notification appeared

---

## 💡 Still Not Working?

### Check These:

- [ ] Run `debugNotifications()` and check console output
- [ ] Permission status is `"granted"`
- [ ] Test with **app completely closed** (swiped away)
- [ ] Test on **real device** (not simulator if on iOS)
- [ ] Check phone is **not in silent mode**
- [ ] **Restart your app** completely (stop Metro bundler, restart)
- [ ] **Reinstall the app** to reset permissions

### Console Commands to Run:

```bash
# Kill Metro bundler
lsof -ti:8081 | xargs kill -9

# Clear React Native cache
npx react-native start --reset-cache

# Rebuild the app
npx expo run:ios
# or
npx expo run:android
```

---

## ✅ What to Expect When Working

**App in Foreground (open):**

- iOS: Thin banner at top (may be easy to miss)
- Android: Heads-up notification or in drawer

**App in Background/Closed:**

- iOS: Clear banner notification with sound
- Android: Notification in status bar + heads-up notification

**Scheduled notifications (11 AM, 5 PM):**

- Will appear even if app hasn't been opened for days
- Will appear at exact time specified
- Will have sound/vibration based on phone settings

---

## 🆘 Last Resort

If absolutely nothing works:

1. **Delete the app completely**
2. **Restart your phone**
3. **Reinstall the app**
4. When permission prompt appears, **carefully tap "Allow"**
5. Run `debugNotifications()`
6. Try the 5-second test above

This fixes 95% of stubborn notification issues!
