import { useThemeColors } from "@/hooks/useThemeColors";
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React from "react";
import { View } from "react-native";
import './globals.css';

export default function RootLayout() {
  const colors = useThemeColors();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.orange } // global default
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
      </Stack>
    </View>
  );
}