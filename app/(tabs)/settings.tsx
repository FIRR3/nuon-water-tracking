import { isDeviceConnected } from "@/ble/bleservice";
import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import Section from "@/components/Section";
import SettingsRow from "@/components/SettingsRow";
import { useTheme } from "@/components/ThemeContext";
import ToggleButton from "@/components/ToggleButton";
import { AppIcons, UIIcons } from "@/constants/icon";
import { useNetworkState } from "@/hooks/useNetworkState";
import { useUserStore } from "@/hooks/useUserStore";
import {
  getNotificationSettings,
  setNotificationsEnabled,
} from "@/services/notifications";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { scale } from "react-native-size-matters";
import { calculateAge } from "../../utils/calulateAge";

export function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

const Settings = () => {
  const {
    userProfile,
    healthProfile,
    recommendedIntake,
    pendingSyncCount,
    pendingEditsCount,
    syncAllOfflineData,
  } = useUserStore();

  const { colors, toggleTheme, isDark } = useTheme();

  const { isOnline } = useNetworkState();

  const [customGoal, setCustomGoal] = useState(
    healthProfile?.customWaterGoal?.toString() || null,
  );

  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDark ? true : false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<string>("checking...");
  const [bleConnected, setBleConnected] = useState(false);

  // Check BLE connection status periodically
  useEffect(() => {
    const checkBleConnection = () => {
      setBleConnected(isDeviceConnected());
    };

    // Initial check
    checkBleConnection();

    // Check every 2 seconds
    const interval = setInterval(checkBleConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  // Load notification settings and check permissions on mount
  useEffect(() => {
    async function loadNotificationSettings() {
      const settings = await getNotificationSettings();
      setNotificationsEnabledState(settings.enabled);

      // Check actual permission status
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    }
    loadNotificationSettings();
  }, []);

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    const newValue = !notificationsEnabled;

    // Check current permission
    const { status } = await Notifications.getPermissionsAsync();

    if (status === "undetermined" || status === "denied") {
      // Need to request permission
      Alert.alert(
        "Request Permission",
        "This app needs notification permission to send you water reminders.\n\n" +
          "Current status: " +
          status,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Continue",
            onPress: async () => {
              try {
                const result = await Notifications.requestPermissionsAsync({
                  ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                  },
                });

                setPermissionStatus(result.status);

                if (result.status === "granted") {
                  setNotificationsEnabledState(true);
                  await setNotificationsEnabled(true);

                  Alert.alert(
                    "Smart Reminders Enabled",
                    "You'll receive personalized hydration check-ins at:\n\n" +
                      "• 10:00 AM\n" +
                      "• 2:00 PM\n" +
                      "• 6:00 PM",
                    [{ text: "Got it" }],
                  );
                } else {
                  setNotificationsEnabledState(false);
                  Alert.alert(
                    "Permission Denied",
                    "Notifications were denied. Go to Settings → Notifications to enable them manually.",
                    [{ text: "OK" }],
                  );
                }
              } catch (err) {
                console.error("Error requesting notification permission:", err);
              }
            },
          },
        ],
      );
      return;
    }

    // Permission already granted, just toggle
    setNotificationsEnabledState(newValue);
    const success = await setNotificationsEnabled(newValue);

    if (!success && newValue) {
      setNotificationsEnabledState(false);
      Alert.alert(
        "Error",
        "Failed to enable notifications. Try restarting the app.",
        [{ text: "OK" }],
      );
    } else if (success && newValue) {
      Alert.alert(
        "Smart Reminders Enabled",
        "You'll receive personalized hydration check-ins at 10 AM, 2 PM, and 6 PM.",
        [{ text: "Got it" }],
      );
    } else if (success && !newValue) {
      Alert.alert(
        "Reminders Disabled",
        "You won't receive water reminders anymore.",
        [{ text: "OK" }],
      );
    }
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
    setDarkModeEnabled((prev) => !prev);
  };

  let userName =
    userProfile?.firstName && userProfile?.lastName
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : "User";
  let age = userProfile?.birthday ? calculateAge(userProfile.birthday) : 0;
  let currentWeight = healthProfile?.weight || 0;
  let waterGoal = customGoal ? customGoal : recommendedIntake;
  let activityLevel = healthProfile?.activityLevel || "Moderate";

  const totalPending = pendingSyncCount + pendingEditsCount;

  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert(
        "Offline",
        "Please connect to the internet to sync your data.",
      );
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncAllOfflineData();
      if (result.synced > 0) {
        Alert.alert("Success", `Synced ${result.synced} items successfully!`);
      } else {
        Alert.alert("Info", "All data is already synced.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to sync data. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ScreenBackgroundWrapper>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingBottom: scale(130),
          paddingTop: scale(55),
          display: "flex",
          gap: scale(35),
        }}
      >
        {/* BLE Connection Status */}
        <View className="absolute right-6 mt-8 rounded-xl flex-row items-center gap-2">
          {bleConnected ? (
            <>
              <UIIcons.checked size={20} />
              <Text className="text-light-primary dark:text-dark-primary text-sm font-poppins-light">
                Water bottle connected
              </Text>
            </>
          ) : (
            <>
              <View className="w-[20px] h-[20px] rounded-full border-2 border-light-primary/30 dark:border-white/30" />
              <Text className="text-light-primary/60 dark:text-white/60 text-sm font-poppins-light">
                Water bottle not connected
              </Text>
            </>
          )}
        </View>

        <Section rounded className="gap-[1px]">
          <SettingsRow showHR>
            <Text
              numberOfLines={1}
              className="text-light-primary dark:text-dark-primary text-lg font-poppins-medium flex-1"
              style={{ marginRight: scale(8) }}
            >
              {userName}
            </Text>
            <Text className="text-light-primary dark:text-dark-primary text-md font-poppins-semibold">
              {age + " years"}
            </Text>
          </SettingsRow>

          <SettingsRow>
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              Current weight
            </Text>
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-semibold">
              {currentWeight + "kg"}
            </Text>
          </SettingsRow>

          <SettingsRow>
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              Water goal
            </Text>
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-semibold">
              {waterGoal / 1000 + "L"}
            </Text>
          </SettingsRow>

          <SettingsRow>
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              <Text className="font-poppins-semibold">
                {capitalizeFirstLetter(activityLevel)}
              </Text>{" "}
              activity level
            </Text>
          </SettingsRow>
        </Section>

        <Section rounded title="Customization">
          <SettingsRow
            linkTo="/settings/personal-details"
            showHR
            icon={AppIcons.profileAdd}
          >
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              Personal details
            </Text>
          </SettingsRow>
          <SettingsRow
            linkTo="/settings/water-settings"
            showHR
            icon={AppIcons.droplet}
          >
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              Water settings
            </Text>
          </SettingsRow>
          <SettingsRow
            linkTo="/settings/activity-level"
            icon={AppIcons.activity}
          >
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              Activity level
            </Text>
          </SettingsRow>
        </Section>

        <Section rounded title="App Settings">
          <SettingsRow
            linkTo="/settings/my-account"
            showHR
            icon={AppIcons.profile}
          >
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              My account
            </Text>
          </SettingsRow>

          <SettingsRow
            showHR
            icon={AppIcons.bell}
            onPress={handleNotificationToggle}
          >
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              Notifications
            </Text>
            <ToggleButton
              isToggled={notificationsEnabled}
              onPress={handleNotificationToggle}
            />
          </SettingsRow>

          <SettingsRow
            showHR
            icon={AppIcons.moon}
            onPress={handleDarkModeToggle}
          >
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              Dark mode
            </Text>
            <ToggleButton
              isToggled={darkModeEnabled}
              onPress={handleDarkModeToggle}
            />
          </SettingsRow>

          <SettingsRow linkTo="/settings/privacy-policy" icon={AppIcons.lock}>
            <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
              Privacy policy
            </Text>
          </SettingsRow>
        </Section>

        {/* Sync Status Section - Only show when offline AND has pending items */}
        {!isOnline && totalPending > 0 && (
          <Section rounded title="Sync Status">
            <View className="p-4">
              <Text className="text-light-primary dark:text-dark-primary text-sm font-poppins mb-2">
                {totalPending} item{totalPending !== 1 ? "s" : ""} pending sync
              </Text>
              {pendingSyncCount > 0 && (
                <Text className="text-light-primary/70 dark:text-white/70 text-xs font-poppins">
                  • {pendingSyncCount} water intake log
                  {pendingSyncCount !== 1 ? "s" : ""}
                </Text>
              )}
              {pendingEditsCount > 0 && (
                <Text className="text-light-primary/70 dark:text-white/70 text-xs font-poppins mb-3">
                  • {pendingEditsCount} profile edit
                  {pendingEditsCount !== 1 ? "s" : ""}
                </Text>
              )}
              <TouchableOpacity
                onPress={handleManualSync}
                disabled={isSyncing || !isOnline}
                className={`bg-light-accent dark:bg-dark-accent py-3 rounded-lg ${isSyncing || !isOnline ? "opacity-50" : ""}`}
              >
                <Text className="text-white text-center font-poppins-medium">
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Text>
              </TouchableOpacity>
            </View>
          </Section>
        )}
      </ScrollView>
    </ScreenBackgroundWrapper>
  );
};

export default Settings;
