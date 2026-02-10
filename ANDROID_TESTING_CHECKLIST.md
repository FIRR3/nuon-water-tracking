# Android Testing Checklist

## 📱 Test Environment Setup
- [ ] Device/Emulator Android version: ____________
- [ ] App build installed successfully
- [ ] Development client version: ____________
- [ ] Date tested: ____________

---



## 🔐 Authentication Flow

### Sign Up
- [y] Navigate to signup screen | _Comment: _
- [y] Enter valid email and password | _Comment: _
- [n] Password visibility toggle works | _Comment: Dont think the feature exists
- [y] Sign up button creates account | _Comment: _
- [y] Invalid email shows error | _Comment: _
- [n] Weak password shows error | _Comment: Dont think the feature exists
- [y] Network error handling works | _Comment: _

### Login
- [y] Navigate to login screen | _Comment: _
- [y] Enter valid credentials | _Comment: _
- [y] Login button works | _Comment: _
- [y] Invalid credentials show error | _Comment: _
- [n] Password visibility toggle works | _Comment: Dont think the feature exists
- [n] "Forgot password" link works | _Comment: Dont think the feature exists

### Logout
- [y] Logout from settings works | _Comment: _
- [y] Redirects to login screen | _Comment: _
- [y] Session cleared properly | _Comment: _

---

## 🎯 Onboarding Flow

### Step 1: Personal Details
- [y] First name input works | _Comment: _
- [y] Last name input works | _Comment: _
- [y] Birthday picker opens and works | _Comment: _
- [n] Age calculated correctly | _Comment: Dont think the feature exists
- [y] Next button validates fields | _Comment: _

### Step 2: Weight
- [y] Weight slider works | _Comment: Not a slider but int input feild
- [y] Weight displays in kg | _Comment: _
- [y] Can input custom weight | _Comment: _
- [y] Value updates correctly | _Comment: _

### Step 3: Activity Level
- [y] All activity levels selectable | _Comment: _
- [] Low option works | _Comment: _
- [] Moderate option works | _Comment: _
- [] High option works | _Comment: _
- [y] Selection highlights correctly | _Comment: _

### Step 4: Water Goal
- [ ] Recommended intake displayed | _Comment: _
- [ ] Custom goal input works | _Comment: _
- [ ] Can toggle between recommended/custom | _Comment: _
- [ ] Finish button completes onboarding | _Comment: _
- [ ] Redirects to main app | _Comment: _

---

## 💧 Main Water Tracking (Home Tab)

### Liquid Progress Gauge
- [ ] Gauge displays correctly | _Comment: _
- [ ] Shows current intake vs goal | _Comment: _
- [ ] Percentage updates correctly | _Comment: _
- [ ] Animations smooth | _Comment: _
- [ ] Colors theme-aware | _Comment: _

### Quick Add Water
- [ ] Tap gauge opens modal | _Comment: _
- [ ] Default amount buttons work (100ml, 200ml, 250ml, etc.) | _Comment: _
- [ ] Custom amount input works | _Comment: _
- [ ] Add button logs water | _Comment: _
- [ ] Gauge updates immediately | _Comment: _
- [ ] Modal closes after adding | _Comment: _

### Manual Adjustment
- [ ] Plus button increases intake | _Comment: _
- [ ] Minus button decreases intake | _Comment: _
- [ ] Increment amount configurable | _Comment: _
- [ ] Cannot go below 0ml | _Comment: _

---

## 📊 Statistics Tab

### Weekly Chart
- [ ] Bar chart displays 7 days | _Comment: _
- [ ] Today highlighted | _Comment: _
- [ ] Days reaching goal show accent color | _Comment: _
- [ ] Days below goal show gray | _Comment: _
- [ ] Top labels show liters correctly | _Comment: _
- [ ] Goal line visible | _Comment: _
- [ ] Pull to refresh works | _Comment: _

### Streak Display
- [ ] Current streak count accurate | _Comment: _
- [ ] Streak circle shows progress | _Comment: _
- [ ] Fire icon displays | _Comment: _
- [ ] Message shows remaining to goal | _Comment: _
- [ ] "Goal reached" message when complete | _Comment: _

### Today's Hourly Chart
- [ ] Line chart shows 24 hours | _Comment: _
- [ ] Current hour highlighted with dot | _Comment: _
- [ ] Cumulative intake shown | _Comment: _
- [ ] Area fill displays correctly | _Comment: _
- [ ] Smooth curve animation | _Comment: _
- [ ] Drink count accurate | _Comment: _
- [ ] Total liters displayed correctly | _Comment: _

### Data States
- [ ] Loading spinner shows | _Comment: _
- [ ] Error message displays if fetch fails | _Comment: _
- [ ] Offline indicator shows when offline | _Comment: _
- [ ] Offline data displays correctly | _Comment: _

---

## ⚙️ Settings Tab

### User Profile Section
- [ ] Name displays correctly | _Comment: _
- [ ] Age calculated from birthday | _Comment: _
- [ ] Current weight displays | _Comment: _
- [ ] Water goal displays in liters | _Comment: _
- [ ] Activity level displays | _Comment: _

### Customization Settings
- [ ] Personal details navigation works | _Comment: _
- [ ] Water settings navigation works | _Comment: _
- [ ] Activity level navigation works | _Comment: _

### App Settings
- [ ] My account navigation works | _Comment: _
- [ ] Notifications toggle clickable (row + button) | _Comment: _
- [ ] Dark mode toggle clickable (row + button) | _Comment: _
- [ ] Privacy policy navigation works | _Comment: _

### Sync Status (when pending)
- [ ] Shows count of pending items | _Comment: _
- [ ] Sync button visible when online | _Comment: _
- [ ] Sync button triggers sync | _Comment: _
- [ ] Success alert shows count synced | _Comment: _
- [ ] Pending count updates after sync | _Comment: _
- [ ] Offline message shows when offline | _Comment: _

---

## 🎨 Theme System

### Light Mode
- [ ] Background is white/light gray | _Comment: _
- [ ] Text is dark/black | _Comment: _
- [ ] Sections have light gray background | _Comment: _
- [ ] All pages respect light theme | _Comment: _
- [ ] Charts use light-compatible colors | _Comment: _
- [ ] Headers display correctly | _Comment: _

### Dark Mode
- [ ] Background is dark gray/black | _Comment: _
- [ ] Text is white | _Comment: _
- [ ] Sections have dark gray background | _Comment: _
- [ ] All pages respect dark theme | _Comment: _
- [ ] Charts use dark-compatible colors | _Comment: _
- [ ] Headers display correctly | _Comment: _

### Theme Toggle
- [ ] Toggle switch works | _Comment: _
- [ ] Theme changes immediately | _Comment: _
- [ ] Theme persists after app restart | _Comment: _
- [ ] No flickering during switch | _Comment: _
- [ ] All components update correctly | _Comment: _

---

## 🔔 Notifications

### Permission & Setup
- [ ] Permission request dialog appears | _Comment: _
- [ ] Grant permission works | _Comment: _
- [ ] Deny permission handled gracefully | _Comment: _
- [ ] Toggle enables/disables notifications | _Comment: _

### Daily Reminders
- [ ] Scheduled reminders created | _Comment: _
- [ ] Notification appears at set time | _Comment: _
- [ ] Notification shows correct message | _Comment: _
- [ ] Tapping notification opens app | _Comment: _
- [ ] Can customize reminder times (if implemented) | _Comment: _

---

## 🛜 Offline Mode

### Going Offline
- [ ] Offline indicator appears when disconnected | _Comment: _
- [ ] Can add water intake offline | _Comment: _
- [ ] Statistics show locally cached data | _Comment: _
- [ ] Pending sync count increases | _Comment: _

### Coming Online
- [ ] Offline indicator disappears | _Comment: _
- [ ] Auto-sync triggers (if enabled) | _Comment: _
- [ ] Data syncs to cloud | _Comment: _
- [ ] Pending count decreases | _Comment: _
- [ ] No duplicate entries | _Comment: _

---

## 🔗 Bluetooth (BLE) Integration

### Connection
- [ ] BLE permission requested | _Comment: _
- [ ] Location permission requested (Android 12+) | _Comment: _
- [ ] Scans for DRINK-TRACKER device | _Comment: _
- [ ] Connects to device successfully | _Comment: _
- [ ] Status shows "Connected" | _Comment: _
- [ ] Connection persists in background | _Comment: _

### Data Reception
- [ ] Weight data received from ESP32 | _Comment: _
- [ ] Parsed weight displays correctly | _Comment: _
- [ ] Water intake auto-logged | _Comment: _
- [ ] Gauge updates automatically | _Comment: _
- [ ] Source marked as "bluetooth" | _Comment: _

### Connection States
- [ ] Shows "Scanning..." status | _Comment: _
- [ ] Shows "Connecting..." status | _Comment: _
- [ ] Shows "Connected" status | _Comment: _
- [ ] Handles disconnection gracefully | _Comment: _
- [ ] Auto-reconnects after disconnect | _Comment: _

---

## 🔧 Settings Sub-Pages

### Personal Details
- [ ] Page loads correctly | _Comment: _
- [ ] Can edit first name | _Comment: _
- [ ] Can edit last name | _Comment: _
- [ ] Can change birthday | _Comment: _
- [ ] Save button works | _Comment: _
- [ ] Changes persist | _Comment: _
- [ ] Theme colors applied correctly | _Comment: _

### Water Settings
- [ ] Current goal displays | _Comment: _
- [ ] Recommended intake shown | _Comment: _
- [ ] Can set custom goal | _Comment: _
- [ ] Can revert to recommended | _Comment: _
- [ ] Save button works | _Comment: _
- [ ] Changes reflect on home screen | _Comment: _

### Activity Level
- [ ] Current level highlighted | _Comment: _
- [ ] Can select Low | _Comment: _
- [ ] Can select Moderate | _Comment: _
- [ ] Can select High | _Comment: _
- [ ] Recommended intake updates | _Comment: _
- [ ] Save button works | _Comment: _

### My Account
- [ ] Email displays | _Comment: _
- [ ] Logout button works | _Comment: _
- [ ] Confirmation dialog appears | _Comment: _
- [ ] Delete account option (if available) | _Comment: _

### Privacy Policy
- [ ] Page loads | _Comment: _
- [ ] Policy text displays | _Comment: _
- [ ] Scrollable content works | _Comment: _

---

## 🧪 Edge Cases & Error Handling

### Network Issues
- [ ] Poor connection handled gracefully | _Comment: _
- [ ] Timeout errors show user message | _Comment: _
- [ ] Failed requests don't crash app | _Comment: _
- [ ] Retry mechanism works | _Comment: _

### Invalid Input
- [ ] Empty fields validated | _Comment: _
- [ ] Negative values prevented | _Comment: _
- [ ] Extremely large values handled | _Comment: _
- [ ] Special characters in text fields | _Comment: _

### App Lifecycle
- [ ] App survives backgrounding | _Comment: _
- [ ] State restored after restart | _Comment: _
- [ ] No memory leaks observed | _Comment: _
- [ ] BLE reconnects after app resume | _Comment: _

### Performance
- [ ] Charts render smoothly | _Comment: _
- [ ] No lag when adding water | _Comment: _
- [ ] Theme switch is instant | _Comment: _
- [ ] Scrolling is smooth | _Comment: _
- [ ] App doesn't drain battery excessively | _Comment: _

---

## 📝 Additional Notes & Issues Found

```
[Use this space to document any bugs, issues, or observations during testing]

Date: ____________

Issues Found:
1. 
2. 
3. 

Feature Requests:
1. 
2. 

Performance Notes:


UX Observations:


```

---

## ✅ Sign-Off

- [ ] All critical features tested
- [ ] Major bugs documented
- [ ] Ready for production | _Comment: _

**Tester Name:** ____________  
**Date Completed:** ____________  
**Overall Rating:** ⭐⭐⭐⭐⭐
