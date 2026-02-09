import Header from "@/components/Header";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { TabBar } from "@/components/TabBar";
import { useSyncManager } from "@/hooks/useSyncManager";
import { useUserStore } from "@/hooks/useUserStore";
import { scheduleMidnightCheck } from "@/utils/dailySummaryMaintenance";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";

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