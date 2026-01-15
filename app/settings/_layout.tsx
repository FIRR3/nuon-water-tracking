import Header from '@/components/Header';
import { Stack } from 'expo-router';

export default function SettingsStackLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => (
          <Header title={options.title || "Settings"} showBack={true} />
        ),
      }}
    >
      <Stack.Screen name="personal-details" options={{ title: "Personal details" }} />
      <Stack.Screen name="water-settings" options={{ title: "Water settings" }} />
      <Stack.Screen name="activity-level" options={{ title: "Activity level" }} />
      <Stack.Screen name="my-account" options={{ title: "My account" }} />
      <Stack.Screen name="privacy-policy" options={{ title: "Privacy policy" }} />
    </Stack>
  );
}