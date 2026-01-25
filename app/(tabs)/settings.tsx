import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import Section from "@/components/Section";
import SettingsRow from "@/components/SettingsRow";
import ToggleButton from "@/components/ToggleButton";
import { AppIcons } from "@/constants/icon";
import { useAppwriteFetch } from "@/hooks/useAppwriteFetch";
import { useAuth } from "@/hooks/useAuth";
import {
  USER_HEALTH_PROFILES_TABLE_ID,
  USERS_TABLE_ID,
} from "@/services/appwrite";
import React, { useState } from "react";
import { ScrollView, Text } from "react-native";
import { scale } from "react-native-size-matters";

export function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function getYearDifference(date1: Date): number {
  const today = new Date();
  let years = today.getFullYear() - date1.getFullYear();
  if (
    today.getMonth() < date1.getMonth() ||
    (today.getMonth() === date1.getMonth() && today.getDate() < date1.getDate())
  ) {
    years--;
  }
  return years;
}

const Settings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const { userId } = useAuth.getState();

  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refetch: userRefetch,
  } = useAppwriteFetch(USERS_TABLE_ID);
  const {
    data: userHealthProfileData,
    loading: userHealthProfileLoading,
    error: userHealthProfileError,
    refetch: userHealthProfileRefetch,
  } = useAppwriteFetch(USER_HEALTH_PROFILES_TABLE_ID);

  // To find the specific user among the table logs
  const userProfile =
    !userLoading && userData
      ? userData.find((profile: any) => profile.$id === userId)
      : null;
  const userHealthProfile =
    !userHealthProfileLoading && userHealthProfileData
      ? userHealthProfileData.find((profile: any) => profile.$id === userId)
      : null;

  // Displayed variables
  let userName = userLoading
    ? "Loading..."
    : userProfile
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : "User";

  let age = userLoading
    ? "..."
    : userProfile
      ? `${getYearDifference(new Date(userProfile.birthday))} years`
      : "";

  let currentWeight = userHealthProfileLoading
    ? "..."
    : userHealthProfile
      ? `${userHealthProfile.weight}kg`
      : "Error";

  let waterGoal = userHealthProfileLoading
    ? "..."
    : userHealthProfile
      ? userHealthProfile.customWatergoal
        ? `${userHealthProfile.customWaterGoal / 1000}L`
        : "2.4L"
      : "Error";

  let activityLevel = userHealthProfileLoading
    ? "..."
    : userHealthProfile
      ? `${userHealthProfile.activityLevel}`
      : "Error";

  return (
    <ScreenBackgroundWrapper>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingBottom: scale(130),
          display: "flex",
          gap: scale(35),
        }}
      >
        <Section rounded className="mt-8 gap-[1px]">
          <SettingsRow showHR>
            <Text className="text-white text-lg font-poppins-medium">
              {userName}
            </Text>
            <Text className="text-white text-md font-poppins-semibold">
              {age}
            </Text>
          </SettingsRow>

          <SettingsRow>
            <Text className="text-white text-[15px] font-poppins-medium">
              Current weight
            </Text>
            <Text className="text-white text-[15px] font-poppins-semibold">
              {currentWeight}
            </Text>
          </SettingsRow>

          <SettingsRow>
            <Text className="text-white text-[15px] font-poppins-medium">
              Water goal
            </Text>
            <Text className="text-white text-[15px] font-poppins-semibold">
              {waterGoal}
            </Text>
          </SettingsRow>

          <SettingsRow>
            <Text className="text-white text-[15px] font-poppins-medium">
              <Text className="font-poppins-semibold">{activityLevel}</Text>{" "}
              activity level
            </Text>
          </SettingsRow>
        </Section>

        <Section rounded title="Customization">
          <SettingsRow
            linkTo="/settings/personal-details"
            showHR
            icon={AppIcons.profileAdd}
          >
            <Text className="text-white text-[15px] font-poppins-medium">
              Personal details
            </Text>
          </SettingsRow>
          <SettingsRow
            linkTo="/settings/water-settings"
            showHR
            icon={AppIcons.droplet}
          >
            <Text className="text-white text-[15px] font-poppins-medium">
              Water settings
            </Text>
          </SettingsRow>
          <SettingsRow
            linkTo="/settings/activity-level"
            icon={AppIcons.activity}
          >
            <Text className="text-white text-[15px] font-poppins-medium">
              Activity level
            </Text>
          </SettingsRow>
        </Section>

        <Section rounded title="App Settings">
          <SettingsRow
            linkTo="/settings/my-account"
            showHR
            icon={AppIcons.profile}
          >
            <Text className="text-white text-[15px] font-poppins-medium">
              My account
            </Text>
          </SettingsRow>

          <SettingsRow
            showHR
            icon={AppIcons.bell}
            onPress={() => setNotificationsEnabled((prev) => !prev)}
          >
            <Text className="text-white text-[15px] font-poppins-medium">
              Notifications
            </Text>
            <ToggleButton
              isToggled={notificationsEnabled}
              onPress={() => setNotificationsEnabled((prev) => !prev)}
            />
          </SettingsRow>

          <SettingsRow
            showHR
            icon={AppIcons.moon}
            onPress={() => setDarkModeEnabled((prev) => !prev)}
          >
            <Text className="text-white text-[15px] font-poppins-medium">
              Dark mode
            </Text>
            <ToggleButton
              isToggled={darkModeEnabled}
              onPress={() => setDarkModeEnabled((prev) => !prev)}
            />
          </SettingsRow>

          <SettingsRow linkTo="/settings/privacy-policy" icon={AppIcons.lock}>
            <Text className="text-white text-[15px] font-poppins-medium">
              Privacy policy
            </Text>
          </SettingsRow>
        </Section>
      </ScrollView>
    </ScreenBackgroundWrapper>
  );
};

export default Settings;
