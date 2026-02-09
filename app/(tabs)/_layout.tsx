import Header from "@/components/Header";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { TabBar } from "@/components/TabBar";
import { useSyncManager } from "@/hooks/useSyncManager";
import { useUserStore } from "@/hooks/useUserStore";
import {
  hasShownNotificationPrompt,
  markNotificationPromptShown,
  setNotificationsEnabled,
} from "@/services/notifications";
import { scheduleMidnightCheck } from "@/utils/dailySummaryMaintenance";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Alert, View } from "react-native";

const _TabLayout = () => {
  const { authUser, healthProfile, recommendedIntake } = useUserStore();
  
  // Enable automatic syncing of offline water intake logs, profile edits, and summaries
  useSyncManager(true);
  
  // Schedule midnight summary creation checks
  useEffect(() => {
    if (!authUser?.$id) return;
    
    const getCurrentGoal = () => {
      return healthProfile?.customWaterGoal || recommendedIntake || 2400;
    };
    
    // Start midnight check scheduler
    const cleanup = scheduleMidnightCheck(authUser.$id, getCurrentGoal);
    
    return cleanup;
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
            "Would you like to receive daily reminders to drink water?\n\n" +
              "You'll get notifications at:\n" +
              "• 11:00 AM\n" +
              "• 5:00 PM",
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
                      "Reminders Enabled",
                      "You'll receive daily reminders at 11 AM and 5 PM.",
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
              title={route.name === 'settings' ? 'Settings' : 'Statistics'}
            />
          ),
        }}
      >
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        <Tabs.Screen name="index" options={{ title: "Water", headerShown: false }} />
        <Tabs.Screen name="statistics" options={{ title: "Statistics" }} />
      </Tabs>
    </View>
  );
};

export default _TabLayout;
