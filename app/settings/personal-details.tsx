import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import Section from "@/components/Section";
import SettingsRow from "@/components/SettingsRow";
import {
  getPersonalDetails,
  PersonalDetails as PersonalDetailsType,
} from "@/services/storage";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

const PersonalDetails = () => {
  const [personalDetails, setPersonalDetails] =
    useState<PersonalDetailsType | null>(null);

  useEffect(() => {
    const loadPersonalDetails = async () => {
      try {
        const details = await getPersonalDetails();
        setPersonalDetails(details);
      } catch (error) {
        console.error("Error loading personal details:", error);
      }
    };

    loadPersonalDetails();
  }, []);

  // Default values if no data is stored
  const currentWeight = personalDetails?.currentWeight || 56;
  const height = personalDetails?.height || 1.7;
  const dateOfBirth = personalDetails?.dateOfBirth || "2007-01-01";
  const gender = personalDetails?.gender || "Male";
  const activityLevel = personalDetails?.activityLevel || "Sedentary";

  return (
    <ScreenBackgroundWrapper>
      <View className="px-5 pt-10">
        <Text className="text-white text-md font-poppins-semibold">
          Your info
        </Text>
        <Text className="text-white text-sm font-poppins">
          This is what we use to calculate your daily water intake.
        </Text>
      </View>

      <Section className="mt-5">
        <SettingsRow showHR>
          <Text className="text-white text-[15px] font-poppins-medium">
            Current weight
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {currentWeight}kg
          </Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className="text-white text-[15px] font-poppins-medium">
            Height
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {height}m
          </Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className="text-white text-[15px] font-poppins-medium">
            Date of birth
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {dateOfBirth.replaceAll("-", " / ")}
          </Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className="text-white text-[15px] font-poppins-medium">
            Gender
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {gender}
          </Text>
        </SettingsRow>
        <SettingsRow>
          <Text className="text-white text-[15px] font-poppins-medium">
            Activity level
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {activityLevel}
          </Text>
        </SettingsRow>
      </Section>
    </ScreenBackgroundWrapper>
  );
};

export default PersonalDetails;
