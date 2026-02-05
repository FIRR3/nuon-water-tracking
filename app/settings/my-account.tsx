import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import Section from "@/components/Section";
import SettingsRow from "@/components/SettingsRow";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/hooks/useUserStore";
import { account } from "@/services/appwrite";
import { authAPI, userProfileAPI } from "@/services/appwriteService";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";

const MyAccount = () => {
  const { logout } = useAuth();

  const { userProfile, authUser, fetchUserData } = useUserStore();

  // Local state initialized from global state
  const [email, setEmail] = useState(userProfile?.email || "");
  const [firstName, setFirstName] = useState(userProfile?.firstName || "");
  const [lastName, setLastName] = useState(userProfile?.lastName || "");
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
        lastName: lastName.trim(),
      });

      // Refresh global state
      await fetchUserData();

      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await account.deleteSession("current");
            logout(); // Update local state
          } catch (error) {
            console.error(error);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and will delete all your data.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await authAPI.deleteAccount(authUser.$id);
              logout(); // Clear local state and redirect
              Alert.alert(
                "Account Deleted",
                "Your account has been permanently deleted.",
              );
            } catch (error) {
              console.error("Failed to delete account:", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again or contact support.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
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

      <TouchableOpacity
        className="bg-dark-secondary p-5 mt-10"
        onPress={handleDeleteAccount}
        disabled={loading}
      >
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
