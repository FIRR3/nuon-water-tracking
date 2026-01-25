import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { constantColors } from "@/constants/colors";
import { UIIcons } from "@/constants/icon";
import { useAuth } from "@/hooks/useAuth";
import {
  DATABASE_ID,
  databases,
  USER_HEALTH_PROFILES_TABLE_ID,
  USERS_TABLE_ID,
} from "@/services/appwrite";
import MaskedView from "@react-native-masked-view/masked-view";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";
import { scale } from "react-native-size-matters";
import Arrow from "../../assets/images/arrow.svg";
import Encircle from "../../assets/images/encircle.svg";
import Underline1 from "../../assets/images/underline.svg";


import Image1 from "../../assets/images/water-drinking.svg";

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [activityLevel, setActivityLevel] = useState("");

  const heightRef = useRef<TextInput>(null);
  const genderRef = useRef<TextInput>(null);

  const lifestyleOptions = [
    {
      id: "Sedentary",
      description:
        "Little to no daily activity or exercise. Desk job or student lifestyle. Mostly inactive with occasional light walking.",
    },
    {
      id: "Moderate",
      description:
        "Light daily activity with moderate exercise 3-5 days per week. Regular walking, cycling, or similar activities throughout the day.",
    },
    {
      id: "High",
      description:
        "Physically active throughout the day with intense exercise 6-7 days per week. Active job or consistent high-intensity training.",
    },
  ];

  const toggleGenderPicker = () => {
    setShowGenderPicker((prev) => !prev);
  };
  //might be needed for android
  const handleGenderChange = ({ type }: any, selectedGender: any) => {
    if (type == "set") {
      const currentGender = selectedGender;
      setGender(currentGender);

      if (Platform.OS === "android") {
        toggleGenderPicker();
        // Use local Gender methods
        setGender(currentGender);
      }
    } else {
      toggleGenderPicker();
    }
  };
  const confirmGenderIOS = () => {
    setGender(gender);
    toggleGenderPicker();
  };

  const handleNumericInput = (
    text: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setter(cleaned);
  };

  const handleStep2 = () => {
    if (!weight || !height || !gender) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (parseFloat(weight) <= 0 || parseFloat(weight) > 300) {
      Alert.alert("Error", "Please input a valid weight");
      return;
    } else if (parseFloat(height) <= 50 || parseFloat(height) > 300) {
      Alert.alert("Error", "Please input a valid height");
      return;
    }

    setStep(3);
  };

  const handleComplete = async () => {
    const { userId, completeOnboarding } = useAuth.getState();

    if (!userId) return;

    if (!weight || !height || !gender || !activityLevel) {
      Alert.alert(
        "Error",
        "Missing data, please fill in all fields and checkboxes",
      );
      return;
    }

    const convertedWeight = Math.round(parseFloat(weight) * 10) / 10;
    const convertedHeight = Math.round(parseFloat(height)) / 100;

    try {
      // Save user data to database and mark onboarding complete
      await databases.createDocument(
        DATABASE_ID,
        USER_HEALTH_PROFILES_TABLE_ID,
        userId,
        {
          user: userId,
          weight: convertedWeight,
          height: convertedHeight,
          gender,
          activityLevel,
          customWaterGoal: null,
        },
      );

      await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
        hasCompletedOnboarding: true,
      });
    } catch (error: any) {
      Alert.alert("Error", "Failed to save profile");
    }

    completeOnboarding();
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
            entering={FadeInUp.delay(300).duration(2000).springify()}
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
            entering={FadeInDown.delay(800).duration(1000).springify()}
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
            className="text-white text-[50px] font-poppins mb-10"
          >
            Personal Info
            <Underline1 width={320} height={20} />
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(100).duration(1000).springify()}
            className="text-white font-poppins text-sm mb-4"
          >
            We need some info to customize your water recommendation
          </Animated.Text>

          <View className="w-full flex-col gap-5 mb-10">
            <Animated.View
              entering={FadeInDown.delay(300).duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg flex-row justify-between"
            >
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="Weight"
                placeholderTextColor={"gray"}
                keyboardType="decimal-pad"
                returnKeyType="next"
                onSubmitEditing={() => !height && heightRef.current?.focus()}
                maxLength={5}
                className="text-white font-poppins w-[90%]"
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
                onChangeText={(text) => handleNumericInput(text, setHeight)}
                placeholder="Height"
                placeholderTextColor={"gray"}
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => !gender && toggleGenderPicker()}
                maxLength={3}
                className="text-white font-poppins w-[90%]"
              />
              <Text style={{ color: "gray" }} className=" font-poppins">
                cm
              </Text>
            </Animated.View>

            {showGenderPicker && (
              <Animated.View
                entering={FadeInDown.duration(1000).springify()}
                className="my-[-20px]"
              >
                <Picker
                  selectedValue={gender}
                  onValueChange={(value) => setGender(value)}
                >
                  <Picker.Item label="Gender" value="" />
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                </Picker>
              </Animated.View>
            )}

            {showGenderPicker && Platform.OS === "ios" && (
              <Animated.View
                entering={FadeInDown.delay(200).duration(1000).springify()}
                className="flex-row w-full gap-2"
              >
                <TouchableOpacity
                  onPress={toggleGenderPicker}
                  className="flex-1 border-2 border-light-secondary py-[10px] px-4 rounded-xl"
                >
                  <Text className="text-white text-center text-md font-poppins-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmGenderIOS}
                  className="flex-1 bg-dark-accent py-[12px] px-4 rounded-xl"
                >
                  <Text className="text-white text-center text-md font-poppins-medium">
                    Confirm
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {!showGenderPicker && (
              <Animated.View
                entering={FadeInDown.delay(500).duration(1000).springify()}
                className="bg-dark-secondary p-5 rounded-lg w-full"
              >
                <Pressable onPress={toggleGenderPicker}>
                  <TextInput
                    placeholder="Gender"
                    value={gender}
                    onChangeText={setGender}
                    placeholderTextColor={"gray"}
                    editable={false}
                    onPressIn={toggleGenderPicker}
                    className="text-white font-poppins w-full"
                    submitBehavior="blurAndSubmit"
                  />
                </Pressable>
              </Animated.View>
            )}
          </View>

          {!showGenderPicker && Platform.OS === "ios" && (
            <>
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
                  onPress={handleStep2}
                  className="absolute right-0 border-2 border-dark-accent p-3 w-[90%] rounded-2xl flex-row justify-center items-center gap-3"
                >
                  <Text className="text-dark-accent font-poppins text-lg text-center">
                    Next
                  </Text>
                  <UIIcons.arrowUpRight
                    size={24}
                    color={constantColors.accent}
                  />
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </KeyboardAvoidingView>
      </ScreenBackgroundWrapper>
    );
  }

  if (step === 3) {
    return (
      <ScreenBackgroundWrapper>
        <Animated.View
          entering={FadeIn.delay(100).duration(1000).springify()}
          className="absolute top-[12%] right-[15%]"
        >
          <Arrow width={20} />
        </Animated.View>

        <KeyboardAvoidingView className="flex-1 justify-center p-5">
          <Animated.Text
            entering={FadeInUp.duration(1000).springify()}
            className="text-white text-[50px] font-poppins mb-5 text-center"
          >
            Lifestyle
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(100).duration(1000).springify()}
            className="text-white font-poppins text-sm"
          >
            What is your average activity level?
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(400).duration(1000).springify()}
            className="gap-6 mt-8 mb-9"
          >
            {lifestyleOptions.map((option, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setActivityLevel(option.id)}
                  className="gap-1 relative pl-11"
                >
                  {activityLevel == option.id ? (
                    <UIIcons.checked
                      size={scale(28)}
                      style={{ position: "absolute" }}
                    />
                  ) : (
                    <UIIcons.unChecked
                      size={scale(28)}
                      style={{ position: "absolute" }}
                    />
                  )}
                  <Text className="text-white text-sm font-poppins-semibold">
                    {option.id}
                  </Text>
                  <Text className="text-white text-sm font-poppins">
                    {option.description}
                  </Text>
                </TouchableOpacity>

                {index !== lifestyleOptions.length - 1 && (
                  <View className="bg-white h-[1px]"></View>
                )}
              </React.Fragment>
            ))}
          </Animated.View>

          <Animated.View
            entering={FadeInRight.delay(800).duration(1000).springify()}
            className="w-full h-[70px] flex relative"
          >
            <TouchableOpacity
              onPress={() => setStep(2)}
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
              onPress={handleComplete}
              className="absolute right-0 border-2 border-dark-accent p-3 w-[90%] rounded-2xl flex-row justify-center items-center gap-3"
            >
              <Text className="text-dark-accent font-poppins text-lg text-center">
                Complete
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </ScreenBackgroundWrapper>
    );
  }
}
