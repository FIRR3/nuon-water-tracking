import { Stack } from 'expo-router';
import React from 'react';

export default function AuthStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signup" options={{ title: "Sign up" }} />
      <Stack.Screen name="login" options={{ title: "Log in" }} />
    </Stack>
  );
}