# Cloud Storage Implementation - Setup Instructions

## ✅ Implementation Complete

All features have been successfully implemented for cloud storage of water intake logs!

## 📦 Required Dependency Installation

Run the following command to install the missing dependency:

```bash
npx expo install @react-native-community/netinfo
```

## 🗄️ Database Schema

Ensure your Appwrite `water_intake_logs` collection has these attributes:

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | String (Relationship) | Yes | Relationship to users table |
| `amount` | Integer | Yes | Water amount in ml |
| `timestamp` | DateTime | Yes | When the drink occurred |
| `source` | String | Yes | Either 'bluetooth' or 'manual' |
| `syncedAt` | DateTime | Yes | When synced to cloud |

**Indexes to create:**
- `user_timestamp_idx`: user (ASC), timestamp (DESC)
- `user_idx`: user (ASC)

**Permissions:**
- Document-level: Users can only read/write their own documents
- Collection-level: Authenticated users can create documents

## 🚀 What Was Implemented

### 1. **Offline Queue Service** (`services/waterIntakeLogsService.js`)
   - Saves all water intake entries locally first using AsyncStorage
   - Automatically retries failed syncs with exponential backoff
   - Handles network failures gracefully
   - Tracks retry attempts (max 5 retries)
   - Provides sync status listeners for UI updates

### 2. **Enhanced useUserStore** (`hooks/useUserStore.js`)
   - Integrated cloud storage for all water intake operations
   - Added `syncStatus` and `pendingSyncCount` state tracking
   - New methods:
     - `addWaterIntake(amount, source)` - Saves to cloud with offline support
     - `removeWaterIntake(amount)` - Removes water (adds negative entry)
     - `syncOfflineData()` - Manually trigger sync
     - `setupSyncListener()` - Listen to sync status changes
   - Auto-syncs offline queue on app start
   - Syncs pending data before logout

### 3. **Updated WeightScreen Component** (`components/weight_tester.js`)
   - Bluetooth drink events now save directly to cloud
   - Uses `useUserStore.addWaterIntake()` with `source: 'bluetooth'`
   - Error handling doesn't break BLE connection
   - Failed saves are queued for retry

### 4. **Migrated Main Screen** (`app/(tabs)/index.tsx`)
   - Removed dependency on local storage for water intake
   - Uses cloud storage exclusively via `useUserStore`
   - Manual adjustments save to cloud with `source: 'manual'`
   - Pull-to-refresh syncs offline queue
   - Shows sync status (if you want to display it)

### 5. **Automatic Sync Manager** (`hooks/useSyncManager.js`)
   - Syncs when app comes to foreground
   - Syncs when network connectivity is restored
   - Periodic sync every 5 minutes when app is active
   - Minimum 30 seconds between syncs to prevent spam
   - Integrated into tab layout for app-wide coverage

### 6. **Updated Appwrite Service** (`services/appwriteService.js`)
   - Added optional `timestamp` parameter to `waterIntakeAPI.create()`
   - Preserves original timestamp when syncing offline entries

## 🔄 Data Flow

```
┌─────────────┐
│  ESP32 BLE  │ Drink Event
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  WeightScreen    │ Receives BLE data
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│  useUserStore      │ addWaterIntake()
│  addWaterIntake()  │
└─────────┬──────────┘
          │
          ▼
┌──────────────────────────┐
│ waterIntakeLogsService   │
└─────────┬────────────────┘
          │
          ├──► 1. Save to AsyncStorage (offline queue)
          │
          └──► 2. Try cloud sync (Appwrite)
                    │
                    ├──► Success: Remove from queue
                    │
                    └──► Failure: Keep in queue, retry later
```

## 🔧 Key Features

### **Offline-First Architecture**
- ✅ All entries saved locally first
- ✅ Works without internet connection
- ✅ Automatic background sync when online
- ✅ No data loss

### **Reliability**
- ✅ Automatic retry with exponential backoff
- ✅ Max 5 retry attempts per entry
- ✅ Persists across app restarts
- ✅ Error handling throughout

### **Performance**
- ✅ Non-blocking - UI stays responsive
- ✅ Batch operations supported
- ✅ Minimal network overhead
- ✅ Smart sync timing

### **User Experience**
- ✅ Instant feedback (local-first)
- ✅ Sync status tracking available
- ✅ Pull-to-refresh support
- ✅ Seamless operation

## 📱 Usage Examples

### Bluetooth Water Intake (Automatic)
```javascript
// Handled automatically by WeightScreen
// When BLE receives data, it calls:
await addWaterIntake(grams, 'bluetooth');
```

### Manual Water Adjustment
```javascript
// Add water
await addWaterIntakeToCloud(250, 'manual');

// Remove water
await addWaterIntakeToCloud(-100, 'manual');
```

### Manual Sync Trigger
```javascript
await syncOfflineData();
```

### Check Pending Sync Count
```javascript
const { pendingSyncCount } = useUserStore();
// Display badge: {pendingSyncCount > 0 && <Badge count={pendingSyncCount} />}
```

## 🐛 Troubleshooting

### Issue: Entries not syncing
**Solution:** Check network connectivity and Appwrite permissions

### Issue: Duplicate entries
**Solution:** Shouldn't happen due to unique local IDs, but check offline queue

### Issue: High pending count
**Solution:** Check Appwrite connection and authentication

### Issue: Old local storage data
**Solution:** The app still reads settings from local storage for backwards compatibility

## 🔐 Security Notes

- All water intake entries include user ID
- Appwrite permissions should restrict users to their own data
- Authentication required for all operations
- Timestamps preserved for accurate logging

## 🎯 Testing Checklist

- [ ] Install @react-native-community/netinfo package
- [ ] Test Bluetooth drink event → saves to cloud
- [ ] Test manual water adjustment → saves to cloud
- [ ] Test offline mode → entries queue correctly
- [ ] Test going back online → automatic sync occurs
- [ ] Test app foreground → sync triggers
- [ ] Test pull-to-refresh → data refreshes
- [ ] Verify Appwrite collection structure matches schema
- [ ] Check Appwrite permissions are configured correctly
- [ ] Test with poor network conditions

## 📈 Next Steps (Optional Enhancements)

1. **Add UI sync indicator** - Show sync status in header
2. **Daily summaries** - Aggregate daily stats in background
3. **Conflict resolution** - Handle edge cases (if needed)
4. **Analytics** - Track sync performance
5. **Local caching** - Cache recent logs for faster loading
6. **Batch operations** - Optimize network usage
7. **Background sync** - Use background tasks for better reliability

---

**Implementation Date:** February 5, 2026
**Status:** ✅ Complete - Ready for testing
