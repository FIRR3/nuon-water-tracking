import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import Section from "@/components/Section";
import SettingsRow from "@/components/SettingsRow";
import { useUserStore } from "@/hooks/useUserStore";
import React, { useState } from "react";
import { Text, View } from "react-native";

const PersonalDetails = () => {
  const { userProfile, healthProfile, recommendedIntake } = useUserStore();

  const [customGoal, setCustomGoal] = useState(
    healthProfile?.customWaterGoal?.toString() || null,
  );

  let currentWeight = healthProfile?.weight || 0;
  let height = healthProfile?.height || 0;
  // Extract YYYY-MM-DD from ISO string and format as DD/MM/YYYY for display
  let dateOfBirth = "N/A";
  if (userProfile?.birthday) {
    const datePart = userProfile.birthday.split("T")[0]; // "YYYY-MM-DD"
    const [year, month, day] = datePart.split("-");
    dateOfBirth = `${parseInt(day)}/${parseInt(month)}/${year}`;
  }
  let gender = healthProfile?.gender || "N/A";
  let activityLevel = healthProfile?.activityLevel || "N/A";

  return (
    <ScreenBackgroundWrapper>
      <View className="px-5 pt-10">
        <Text className="text-light-primary dark:text-dark-primary text-md font-poppins-semibold">
          Your info
        </Text>
        <Text className="text-light-primary dark:text-dark-primary text-sm font-poppins">
          This is what we use to calculate your daily water intake.
        </Text>
      </View>

      <Section className="mt-5">
        <SettingsRow showHR>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
            Current weight
          </Text>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-semibold">
            {currentWeight}kg
          </Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
            Height
          </Text>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-semibold">
            {height}m
          </Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
            Date of birth
          </Text>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-semibold">
            {dateOfBirth}
          </Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
            Gender
          </Text>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-semibold">
            {gender}
          </Text>
        </SettingsRow>
        <SettingsRow>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-medium">
            Activity level
          </Text>
          <Text className="text-light-primary dark:text-dark-primary text-[15px] font-poppins-semibold">
            {activityLevel}
          </Text>
        </SettingsRow>
      </Section>
    </ScreenBackgroundWrapper>
  );
};

export default PersonalDetails;
