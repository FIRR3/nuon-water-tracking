import { icons } from "@/constants/icons";
import { Tabs } from "expo-router";
import React from "react";
import {
  Image,
  ImageBackground,
  ImageSourcePropType,
  View,
} from "react-native";

interface TabIconProps {
  focused: boolean;
  icons: ImageSourcePropType[];
}

const TabIcon = ({ focused, icons }: TabIconProps) => {
  if (focused) {
    return (
      <ImageBackground className="flex flex-row w-full flex-1 min-w-[112px] min-h-16 mt-4 justify-center items-center rounded-full">
        <Image
          source={icons.length > 1 ? icons[1] : icons[0]}
          className="size-7"
        />
      </ImageBackground>
    );
  }

  return (
    <View className="size-full justify-center items-center mt-4 rounded-full">
      <Image source={icons[0]} className="size-7" />
    </View>
  );
};

const _Layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "tomato",
        },
      }}
    >
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icons={[icons.gearWhite, icons.gearBlue]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icons={[icons.waterdrop]} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icons={[icons.graphWhite, icons.graphBlue]}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default _Layout;
