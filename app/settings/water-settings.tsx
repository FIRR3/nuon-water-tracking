import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { useTheme } from "@/components/ThemeContext";
import { constantColors } from "@/constants/colors";
import { useUserStore } from "@/hooks/useUserStore";
import Slider from "@react-native-community/slider";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

const WaterSettings = () => {
  const { colors } = useTheme();
  const { healthProfile, recommendedIntake, updateHealthProfile } =
    useUserStore();

  const waterGoal = healthProfile?.customWaterGoal || recommendedIntake;
  const maxValue = 5;
  const [sliderState, setSliderState] = useState<number>(waterGoal / 1000);

  // Sync slider state when waterGoal changes externally
  useEffect(() => {
    if (waterGoal) {
      setSliderState(waterGoal / 1000);
    }
  }, [waterGoal]);

  // Update slider value as user drags it
  const handleSliderChange = (value: number) => {
    setSliderState(value);
  };

  // Reset custom water goal to app's calculated recommendation and save to Appwrite
  const resetToDefault = () => {
    Alert.alert(
      "Reset",
      "Are you sure you want to reset from your custom water goal to our recommended amount?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              // This now saves locally first and syncs to cloud
              await updateHealthProfile({ customWaterGoal: null });
              // useEffect will sync the slider state after the update
            } catch (error) {
              console.error("Error resetting settings:", error);
              Alert.alert(
                "Error",
                "Failed to reset settings. Changes saved locally and will sync when online.",
              );
            }
          },
        },
      ],
    );
  };

  // Save the new custom water goal to Appwrite user_health_profile
  const confirmWaterAmount = async () => {
    const newGoal = Math.round(sliderState * 1000);
    try {
      // This now saves locally first and syncs to cloud
      await updateHealthProfile({ customWaterGoal: newGoal });
      Alert.alert("Success", "Water goal updated!");
    } catch (error) {
      console.error("Error confirming water amount:", error);
      Alert.alert(
        "Notice",
        "Water goal saved locally and will sync when online.",
      );
    }
  };

  return (
    <ScreenBackgroundWrapper>
      <View className="pt-10 gap-28">
        <View className="gap-12 px-5">
          <Text className="text-light-primary dark:text-dark-primary text-sm font-poppins">
            Do you feel like your calculated amount of water is not enough or
            too much for you?
          </Text>
          <Text className="text-light-primary dark:text-dark-primary text-sm font-poppins">
            Change you recommended amount here:
          </Text>
        </View>

        <View className=" gap-8 px-5 w-full">
          <Text className="text-light-primary dark:text-dark-primary text-md font-poppins-semibold text-center">
            Daily goal
          </Text>
          <View className="w-full">
            <Text
              style={{
                alignSelf: "flex-start",
                left: `${(sliderState / maxValue) * 100}%`,
                transform: [
                  { translateX: `${(sliderState / maxValue) * -100}%` },
                ],
              }}
              className="text-light-primary dark:text-dark-primary text-sm font-poppins-semibold"
            >
              {sliderState.toFixed(1) + "L"}
            </Text>
            <Slider
              value={sliderState}
              onValueChange={handleSliderChange}
              minimumValue={0}
              maximumValue={maxValue}
              minimumTrackTintColor={constantColors.accent}
              maximumTrackTintColor={colors.secondary}
            />
          </View>
        </View>

        <View className="gap-[2px]">
          <TouchableOpacity
            className="bg-light-secondary dark:bg-dark-secondary px-5 py-6"
            onPress={resetToDefault}
          >
            <Text className="text-red-600 font-poppins text-center">
              Reset to app recommendation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-light-secondary dark:bg-dark-secondary px-5 py-6"
            onPress={confirmWaterAmount}
          >
            <Text className="text-light-accent dark:text-dark-accent font-poppins text-center">
              Confirm new water amount
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenBackgroundWrapper>
  );
};

export default WaterSettings;
