import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { constantColors } from "@/constants/colors";
import { UIIcons } from "@/constants/icon";
import { useAuth } from "@/hooks/useAuth";
import { DATABASE_ID, databases, USERS_TABLE_ID } from "@/services/appwrite";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";
import { scale } from "react-native-size-matters";
import Image1 from "../../assets/images/water-drinking.svg";

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");
  const [activityLevel, setActivityLevel] = useState("");

  const heightRef = useRef<TextInput>(null);
  const genderRef = useRef<TextInput>(null);

  const handleComplete = async () => {
    const { userId, completeOnboarding } = useAuth.getState();

    if (!userId) return;

    try {
      // Save user data to database and mark onboarding complete
      await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender,
        activityLevel,
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
          <Animated.View entering={FadeInUp.duration(2000).springify()}>
            <Text className="text-white text-center text-[50px] font-poppins">
              Welcome to
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(200).duration(2000).springify()}
            className="flex justify-center mt-2 mb-[-60px]"
          >
            <MaskedView
              maskElement={
                <Text className="font-museoModerno text-xl text-center">
                  NUON
                </Text>
              }
            >
              <LinearGradient
                colors={["#3472F5", "#45B7D1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text
                  style={{ opacity: 0 }}
                  className="font-museoModerno text-xl text-center"
                >
                  Gradient Text
                </Text>
              </LinearGradient>
            </MaskedView>
          </Animated.View>

          <Image1
            width={scale(300)}
            height={scale(200)}
            style={{ marginBottom: 30 }}
          />

          <Animated.View
            entering={FadeInDown.delay(600).duration(1000).springify()}
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
      <ScreenBackgroundWrapper dismissKeyboard>
        <KeyboardAvoidingView className="flex-1 justify-center p-5">
          <Animated.Text
            entering={FadeInUp.duration(1000).springify()}
            className="text-white text-[50px] font-poppins"
          >
            Personal Info
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(100).duration(1000).springify()}
            className="text-white font-poppins"
          >
            We need some info to customize your profile
          </Animated.Text>

          <View className="w-full flex-col gap-5 my-10">
            <Animated.View
              entering={FadeInDown.delay(300).duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg flex-row justify-between"
            >
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="Weight"
                placeholderTextColor={"gray"}
                className="text-white font-poppins w-[90%]"
                returnKeyType="next"
                onSubmitEditing={() => heightRef.current?.focus()}
                submitBehavior="blurAndSubmit"
              />
              <Text style={{ color: "gray" }} className="font-poppins">
                kg
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg flex-row justify-between"
            >
              <TextInput
                ref={heightRef}
                value={height}
                onChangeText={setHeight}
                placeholder="Height"
                placeholderTextColor={"gray"}
                className="text-white font-poppins w-[90%]"
                returnKeyType="next"
                onSubmitEditing={() => genderRef.current?.focus()}
                submitBehavior="blurAndSubmit"
              />
              <Text style={{ color: "gray" }} className=" font-poppins">
                cm
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(500).duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg"
            >
              <TextInput
                ref={genderRef}
                value={gender}
                onChangeText={setGender}
                placeholder="Gender"
                placeholderTextColor={"gray"}
                className="text-white font-poppins w-full"
                returnKeyType="next"
                onSubmitEditing={() => genderRef.current?.focus()}
                submitBehavior="blurAndSubmit"
              />
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInRight.delay(800).duration(1000).springify()}
            className="w-full h-[70px] flex relative"
          >
            <TouchableOpacity
              onPress={() => setStep(1)}
              className="absolute border-2 border-white p-3 w-[90%] rounded-2xl flex-row justify-center items-center gap-3"
            >
              <UIIcons.arrowDownLeft size={24} />
              <Text className="text-white font-poppins text-lg text-center">
                Back
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInLeft.delay(800).duration(1000).springify()}
            className="w-full h-[70px] flex relative"
          >
            <TouchableOpacity
              onPress={() => setStep(3)}
              className="absolute right-0 border-2 border-dark-accent p-3 w-[90%] rounded-2xl flex-row justify-center items-center gap-3"
            >
              <Text className="text-dark-accent font-poppins text-lg text-center">
                Next
              </Text>
              <UIIcons.arrowUpRight size={24} color={constantColors.accent} />
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
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
