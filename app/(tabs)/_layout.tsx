import Header from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { useSyncManager } from "@/hooks/useSyncManager";
import {
    hasShownNotificationPrompt,
    markNotificationPromptShown,
    setNotificationsEnabled,
} from "@/services/notifications";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Alert } from "react-native";

const _TabLayout = () => {
  // Enable automatic syncing of offline water intake logs
  useSyncManager(true);

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
  );
};

export default _TabLayout;
