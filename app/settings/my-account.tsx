import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import Section from "@/components/Section";
import SettingsRow from "@/components/SettingsRow";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/hooks/useUserStore";
import { account } from "@/services/appwrite";
import { userProfileAPI } from "@/services/appwriteService";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";

const MyAccount = () => {
  const { logout } = useAuth();

  const { userProfile, authUser, fetchUserData } = useUserStore();
  
  // Local state initialized from global state
  const [email, setEmail] = useState(userProfile?.email || '');
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [loading, setLoading] = useState(false);

  const unitSystem = "Metric";
  const language = "English";

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Update in database
      await userProfileAPI.update(authUser.$id, {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
      
      // Refresh global state
      await fetchUserData();
      
      Alert.alert('Success', 'Profile updated!');
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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