import { Tabs } from "expo-router";
import React from "react";

const _Layout = () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings"
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Home"
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics"
        }}
      />
    </Tabs>
  )
}

export default _Layout