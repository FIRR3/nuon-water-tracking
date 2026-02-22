import Header from "@/components/Header";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { TabBar } from "@/components/TabBar";
import { useSyncManager } from "@/hooks/useSyncManager";
import { useUserStore } from "@/hooks/useUserStore";
import {
  hasShownNotificationPrompt,
  markNotificationPromptShown,
  refreshNotifications,
  setNotificationsEnabled,
} from "@/services/notifications";
import { scheduleMidnightCheck } from "@/utils/dailySummaryMaintenance";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Alert, AppState, View } from "react-native";

const _TabLayout = () => {
  const { authUser, healthProfile, recommendedIntake } = useUserStore();

  // Enable automatic syncing of offline water intake logs, profile edits, and summaries
  useSyncManager(true);

  // Refresh notifications with latest intake data on app foreground
  useEffect(() => {
    // Refresh immediately on mount
    refreshNotifications().catch(() => {});

    // Refresh when app comes back to foreground
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshNotifications().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, []);

  // Schedule midnight summary creation checks
  useEffect(() => {
    if (!authUser?.$id) return undefined;

    const getCurrentGoal = () => {
      return healthProfile?.customWaterGoal || recommendedIntake || 2400;
    };

    // Start midnight check scheduler
    const cleanup = scheduleMidnightCheck(authUser.$id, getCurrentGoal);

    return () => cleanup();
  }, [authUser, healthProfile, recommendedIntake]);

  // Check if we should show the first-login notification prompt
  useEffect(() => {
    const checkNotificationPrompt = async () => {
      const hasShown = await hasShownNotificationPrompt();
      if (!hasShown) {
        // Small delay to let the app finish loading
        setTimeout(() => {
          Alert.alert(
            "Stay Hydrated",
            "Would you like to receive smart hydration check-ins?\n\n" +
              "You'll get personalized updates at:\n" +
              "• 10:00 AM\n" +
              "• 2:00 PM\n" +
              "• 6:00 PM",
            [
              {
                text: "Not Now",
                style: "cancel",
                onPress: async () => {
                  await markNotificationPromptShown();
                },
              },
              {
                text: "Enable",
                onPress: async () => {
                  await markNotificationPromptShown();
                  const success = await setNotificationsEnabled(true);
                  if (success) {
                    Alert.alert(
                      "Smart Reminders Enabled",
                      "You'll receive personalized hydration check-ins at 10 AM, 2 PM, and 6 PM showing your progress.",
                      [{ text: "Great" }],
                    );
                  }
                },
              },
            ],
          );
        }, 1000);
      }
    };

    checkNotificationPrompt();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <OfflineIndicator />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          header: ({ route }) => (
            <Header
              title={route.name === "settings" ? "Settings" : "Statistics"}
            />
          ),
        }}
      >
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        <Tabs.Screen
          name="index"
          options={{ title: "Water", headerShown: false }}
        />
        <Tabs.Screen name="statistics" options={{ title: "Statistics" }} />
      </Tabs>
    </View>
  );
};

export default _TabLayout;
