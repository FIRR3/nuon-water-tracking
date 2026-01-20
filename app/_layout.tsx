import Header from "@/components/Header";
import { useAuth } from '@/hooks/useAuth';
import { useThemeColors } from "@/hooks/useThemeColors";
import * as Font from 'expo-font';
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import './globals.css';

const customFonts = {
  'Poppins-Regular': require('@/assets/fonts/Poppins/Poppins-Regular.ttf'),
  'Poppins-Medium': require('@/assets/fonts/Poppins/Poppins-Medium.ttf'),
  'Poppins-SemiBold': require('@/assets/fonts/Poppins/Poppins-SemiBold.ttf'),
  'Poppins-Bold': require('@/assets/fonts/Poppins/Poppins-Bold.ttf'),
};

export default function RootLayout() {
  const { isLoggedIn, hasCompletedOnboarding } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colors = useThemeColors();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (!appIsReady) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    
    setTimeout(() => {
      // Not logged in → signup
      if (!isLoggedIn && !inAuthGroup) {
        router.replace('/(auth)/signup');
      } 
      // Logged in but haven't done onboarding → onboarding
      else if (isLoggedIn && !hasCompletedOnboarding && !inOnboardingGroup) {
        router.replace('/(onboarding)');
      } 
      // Logged in and onboarded → main app
      else if (isLoggedIn && hasCompletedOnboarding && (inAuthGroup || inOnboardingGroup)) {
        router.replace('/(tabs)');
      }
    }, 0);
  }, [isLoggedIn, hasCompletedOnboarding, segments, appIsReady]);

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
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="(onboarding)"
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="settings"
          options={{ headerShown: false }}
        />
      </Stack>
    </View>
  );
}