import Header from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { Tabs } from "expo-router";
import React from "react";

const _TabLayout = () => {
  return (
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
  );
};

export default _TabLayout;