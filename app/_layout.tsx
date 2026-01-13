import { constantColors, darkColors } from "@/constants/colors";
import { useThemeColors } from "@/hooks/useThemeColors";
import * as Font from 'expo-font';
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import './globals.css';
import Header from "@/components/Header";

const customFonts = {
  'Poppins-Regular': require('@/assets/fonts/Poppins/Poppins-Regular.ttf'),
  'Poppins-Medium': require('@/assets/fonts/Poppins/Poppins-Medium.ttf'),
  'Poppins-SemiBold': require('@/assets/fonts/Poppins/Poppins-SemiBold.ttf'),
  'Poppins-Bold': require('@/assets/fonts/Poppins/Poppins-Bold.ttf'),
};

export default function RootLayout() {
  const colors = useThemeColors();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync(customFonts);
      } catch (e) {
        console.warn("Error in prepare:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: true,
          header: ({ route, options }) => (
            <Header
              title={options.title || route.name}
              showBack={true}
            />
          ),
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