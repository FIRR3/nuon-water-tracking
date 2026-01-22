import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { useAuth } from "@/hooks/useAuth";
import { DATABASE_ID, databases, USERS_TABLE_ID } from "@/services/appwrite";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, View } from "react-native";

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    activityLevel: "",
  });

  const handleComplete = async () => {
    const { userId, completeOnboarding } = useAuth.getState();

    if (!userId) return;

    try {
      // Save user data to database and mark onboarding complete
      await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
        weight: userData.weight,
        height: userData.height,
        gender: userData.gender,
        activityLevel: userData.activityLevel,
        hasCompletedOnboarding: true, // Mark as complete in DB
      });

      // Update local state
      completeOnboarding();
      // Root layout will automatically redirect to /(tabs)
    } catch (error: any) {
      Alert.alert("Error", "Failed to save profile");
    }
  };

  if (step === 1) {
    return (
      <ScreenBackgroundWrapper>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-white text-3xl font-poppins-bold mb-4">
            Welcome!
          </Text>
          <Text className="text-white text-lg font-poppins mb-8">
            Let's personalize your experience
          </Text>
          <Button title="Next" onPress={() => setStep(2)} />
        </View>
      </ScreenBackgroundWrapper>
    );
  }

  if (step === 2) {
    return (
      <ScreenBackgroundWrapper>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-white text-2xl font-poppins-bold mb-4">
            Personal Info
          </Text>
          <Text className="text-white font-poppins">
            Name, age, gender input here
          </Text>
          <Button title="Next" onPress={() => setStep(3)} />
          <Button title="Back" onPress={() => setStep(1)} />
        </View>
      </ScreenBackgroundWrapper>
    );
  }

  if (step === 3) {
    return (
      <ScreenBackgroundWrapper>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-white text-2xl font-poppins-bold mb-4">
            Health Profile
          </Text>
          <Text className="text-white font-poppins">
            Weight, height input here
          </Text>
          <Button title="Complete" onPress={handleComplete} />
          <Button title="Back" onPress={() => setStep(2)} />
        </View>
      </ScreenBackgroundWrapper>
    );
  }
}
