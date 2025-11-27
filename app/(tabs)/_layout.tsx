import { TabBar } from "@/components/TabBar";
import { Tabs } from "expo-router";
import React from "react";

const _TabLayout = () => {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
    <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    <Tabs.Screen name="index" options={{ title: "Index" }} />
    <Tabs.Screen name="statistics" options={{ title: "Statistics" }} />
    </Tabs>
  );
};

export default _TabLayout;
