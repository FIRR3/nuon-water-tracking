import Header from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  account,
  DATABASE_ID,
  databases,
  USERS_TABLE_ID,
} from "@/services/appwrite";
import * as Font from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { LogBox, View } from "react-native";
import "./globals.css";

// Suppress specific warnings about asset downloads when offline
LogBox.ignoreLogs([
  "ExpoAsset.downloadAsync",
  "downloadAsync has been rejected",
  "call the function 'ExpoAsset.downloadAsync' has been rejected",
]);

const customFonts = {
  "Poppins-Regular": require("@/assets/fonts/Poppins/Poppins-Regular.ttf"),
  "Poppins-Medium": require("@/assets/fonts/Poppins/Poppins-Medium.ttf"),
  "Poppins-SemiBold": require("@/assets/fonts/Poppins/Poppins-SemiBold.ttf"),
  "Poppins-Bold": require("@/assets/fonts/Poppins/Poppins-Bold.ttf"),

  "MuseoModerno-Regular": require("@/assets/fonts/MuseoModerno/MuseoModerno-Regular.ttf"),
};

export default function RootLayout() {
  const {
    isLoggedIn,
    hasCompletedOnboarding,
    login,
    completeOnboarding,
    logout,
  } = useAuth();

  const router = useRouter();
  const segments = useSegments();
  const colors = useThemeColors();
  const [appIsReady, setAppIsReady] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    // requestNotificationPermissions();
  }, []);

  // Set up global error handler for promise rejections
  useEffect(() => {
    // @ts-ignore - ErrorUtils is available in React Native
    const originalHandler = global.ErrorUtils?.getGlobalHandler();

    // @ts-ignore
    global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
      // Suppress ExpoAsset download errors (fonts are already cached)
      if (
        error?.message?.includes("ExpoAsset.downloadAsync") ||
        error?.message?.includes("downloadAsync")
      ) {
        console.log("Suppressed asset download error (offline mode)");
        return;
      }

      // Call original handler for other errors
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    return () => {
      // Restore original handler on cleanup
      // @ts-ignore
      if (originalHandler) {
        global.ErrorUtils?.setGlobalHandler(originalHandler);
      }
    };
  }, []);

  useEffect(() => {
    if (!appIsReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    setTimeout(() => {
      // Not logged in → signup
      if (!isLoggedIn && !inAuthGroup) {
        router.replace("/(auth)/signup");
      }
      // Logged in but haven't done onboarding → onboarding
      else if (isLoggedIn && !hasCompletedOnboarding && !inOnboardingGroup) {
        router.replace("/(onboarding)");
      }
      // Logged in and onboarded → main app
      else if (
        isLoggedIn &&
        hasCompletedOnboarding &&
        (inAuthGroup || inOnboardingGroup)
      ) {
        router.replace("/(tabs)");
      }
    }, 0);
  }, [isLoggedIn, hasCompletedOnboarding, segments, appIsReady]);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync(customFonts);
        console.log("Fonts loaded successfully");
      } catch (e) {
        // Suppress font loading errors when offline - fonts may already be cached
        console.log("Font loading skipped (may be offline or already cached)");
        // Continue anyway - fonts are likely already loaded from previous sessions
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        // Check if user has active session
        const user = await account.get();

        // Get user document to check onboarding status
        const userDoc = await databases.getDocument(
          DATABASE_ID,
          USERS_TABLE_ID,
          user.$id,
        );

        // Update auth state
        login(user.$id);
        if (userDoc.hasCompletedOnboarding) {
          completeOnboarding();
        }
      } catch (error) {
        // No active session, user needs to login
        logout();
      } finally {
        setIsCheckingSession(false);
      }
    }

    if (appIsReady) {
      checkSession();
    }
  }, [appIsReady]);

  if (!appIsReady || isCheckingSession) {
    return null;
  }

  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: true,
            header: ({ route, options }) => (
              <Header title={options.title || route.name} showBack={true} />
            ),
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}
