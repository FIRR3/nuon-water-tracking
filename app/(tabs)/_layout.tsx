import { TabBar } from "@/components/TabBar";
import { Tabs } from "expo-router";
import React from "react";

const _TabLayout = () => {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="settings" options={{ title: "Settings", headerShown: false }} />
      <Tabs.Screen name="index" options={{ title: "Water", headerShown: false }} />
      <Tabs.Screen name="statistics" options={{ title: "Statistics", headerShown: false }} />
    </Tabs>
  );
};

export default _TabLayout;