import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import Section from "@/components/Section";
import SettingsRow from "@/components/SettingsRow";
import { useAuth } from "@/hooks/useAuth";
import { account } from "@/services/appwrite";
import React from "react";
import { Text, TouchableOpacity } from "react-native";

const MyAccount = () => {
  const { logout } = useAuth();

  const email = "firnab23@varmdogymnasium.se";
  const firstName = "Firuz";
  const lastName = "Nabiev";
  const unitSystem = "Metric";
  const language = "English";

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      logout(); // Update local state
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScreenBackgroundWrapper>
      <Section className="mt-[2px]">
        <SettingsRow showHR>
          <Text className="text-white text-[15px] font-poppins-medium">
            Email
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {email}
          </Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className="text-white text-[15px] font-poppins-medium">
            First name
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {firstName}
          </Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className="text-white text-[15px] font-poppins-medium">
            Last name
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {lastName}
          </Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className="text-white text-[15px] font-poppins-medium">
            Unit system
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {unitSystem}
          </Text>
        </SettingsRow>
        <SettingsRow>
          <Text className="text-white text-[15px] font-poppins-medium">
            Language
          </Text>
          <Text className="text-white text-[15px] font-poppins-semibold">
            {language}
          </Text>
        </SettingsRow>
      </Section>

      <TouchableOpacity className="bg-dark-secondary p-5 mt-10">
        <Text className="text-red-600 text-[15px] font-poppins-medium">
          Delete account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleLogout}
        className="mx-auto mt-20 p-5 rounded-2xl bg-dark-secondary w-4/5"
      >
        <Text className="text-[20px] font-poppins-medium text-center text-dark-accent">
          Log out
        </Text>
      </TouchableOpacity>
    </ScreenBackgroundWrapper>
  );
};

export default MyAccount;