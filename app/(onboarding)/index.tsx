import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { UIIcons } from "@/constants/icon";
import { useAuth } from "@/hooks/useAuth";
import { DATABASE_ID, databases, USERS_TABLE_ID } from "@/services/appwrite";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Image1 from "../../assets/images/water-drinking.svg";

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
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
        <View className="flex-1 justify-center items-center p-5">
          <Animated.Text
            entering={FadeInUp.duration(2000).springify()}
            className="text-white text-xl font-poppins mb-5"
          >
            Welcome to{" "}
            <Text className="font-museoModerno text-dark-accent">NUON</Text>
          </Animated.Text>

          <Image1 />

          {/* <MaskedView maskElement={<Text>Gradient Text</Text>}>
            <LinearGradient
              colors={["#FF6B6B", "#4ECDC4", "#45B7D1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={{ opacity: 0 }}>Gradient Text</Text>
            </LinearGradient>
          </MaskedView> */}

          <Animated.View
            entering={FadeInDown.delay(400).duration(1000).springify()}
            className="w-full"
          >
            <TouchableOpacity
              onPress={() => setStep(2)}
              className="border-2 border-white p-3 w-full rounded-2xl flex-row justify-center items-center gap-3"
            >
              <Text className="text-white font-poppins text-lg text-center">
                Start
              </Text>
              <UIIcons.arrowUpRight size={24} />
            </TouchableOpacity>
          </Animated.View>
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
          <TouchableOpacity
            onPress={() => setStep(1)}
            className="border-2 border-white p-3 w-full rounded-2xl"
          >
            <Text className="text-white font-poppins text-lg text-center">
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStep(3)}
            className="border-2 border-white p-3 w-full rounded-2xl"
          >
            <Text className="text-white font-poppins text-lg text-center">
              Next
            </Text>
          </TouchableOpacity>
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
          <TouchableOpacity
            onPress={() => setStep(2)}
            className="border-2 border-white p-3 w-full rounded-2xl"
          >
            <Text className="text-white font-poppins text-lg text-center">
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleComplete}
            className="border-2 border-white p-3 w-full rounded-2xl"
          >
            <Text className="text-white font-poppins text-lg text-center">
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenBackgroundWrapper>
    );
  }
}
