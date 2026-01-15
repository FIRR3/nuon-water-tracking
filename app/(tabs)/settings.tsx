import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import SettingsRow from "@/components/SettingsRow";
import ToggleButton from "@/components/ToggleButton";
import { AppIcons } from "@/constants/icon";
import React from 'react';
import { ScrollView, Text, View } from "react-native";
import { scale } from "react-native-size-matters";

export function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}


const Settings = () => {

  let userName = 'Firuz Nabiev';
  let age = 18;
  let currentWeight = 71.7;
  let waterGoal = 2400;
  let activityLevel = 'moderate';

  return (
    <ScreenBackgroundWrapper >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: scale(20),
          paddingBottom: scale(130),
          display: 'flex',
          gap: scale(35),
        }}
      >
        <View className="flex flex-col mt-8 bg-dark-secondary rounded-xl px-5 py-5 gap-5">
          <SettingsRow showHR>
            <Text className="text-white text-lg font-poppins-medium">{userName}</Text>
            <Text className="text-white text-md font-poppins-semibold">{age + ' years'}</Text>
          </SettingsRow>
          
          <SettingsRow>
            <Text className="text-white text-[15px] font-poppins-medium">Current weight</Text>
            <Text className="text-white text-[15px] font-poppins-semibold">{currentWeight + 'kg'}</Text>
          </SettingsRow>

          <SettingsRow>
            <Text className="text-white text-[15px] font-poppins-medium">Water goal</Text>
            <Text className="text-white text-[15px] font-poppins-semibold">{waterGoal/1000 + 'L'}</Text>
          </SettingsRow>

          <SettingsRow>
            <Text className="text-white text-[15px] font-poppins-medium">
              <Text className="font-poppins-semibold">{capitalizeFirstLetter(activityLevel)}</Text> activity level
            </Text>
          </SettingsRow>
        </View>

        <View>
          <Text className="text-white text-md font-poppins-semibold mb-[6px]">Customization</Text>
          <View className="flex flex-col bg-dark-secondary rounded-xl px-5 py-5 gap-5">
            <SettingsRow linkTo='/settings/personal-details' showHR icon={AppIcons.profileAdd}>
              <Text className="text-white text-[15px] font-poppins-medium">Personal details</Text>
            </SettingsRow>
            <SettingsRow linkTo='/settings/water-settings' showHR icon={AppIcons.droplet}>
              <Text className="text-white text-[15px] font-poppins-medium">Water settings</Text>
            </SettingsRow>
            <SettingsRow linkTo='/settings/activity-level' icon={AppIcons.activity}>
              <Text className="text-white text-[15px] font-poppins-medium">Activity level</Text>
            </SettingsRow>
          </View>
        </View>

        <View>
          <Text className="text-white text-md font-poppins-semibold mb-[6px]">App Settings</Text>
          <View className="flex flex-col bg-dark-secondary rounded-xl px-5 py-5 gap-5">
            <SettingsRow linkTo='/settings/my-account' showHR icon={AppIcons.profile}>
              <Text className="text-white text-[15px] font-poppins-medium">My account</Text>
            </SettingsRow>
            <SettingsRow showHR icon={AppIcons.bell}>
              <Text className="text-white text-[15px] font-poppins-medium">Notifications</Text>
              <ToggleButton />
            </SettingsRow>
            <SettingsRow showHR icon={AppIcons.moon}>
              <Text className="text-white text-[15px] font-poppins-medium">Dark mode</Text>
              <ToggleButton />
            </SettingsRow>
            <SettingsRow linkTo='/settings/privacy-policy' icon={AppIcons.lock}>
              <Text className="text-white text-[15px] font-poppins-medium">Privacy policy</Text>
            </SettingsRow>
          </View>
        </View>
      </ScrollView>
    </ScreenBackgroundWrapper>
  )
}

export default Settings