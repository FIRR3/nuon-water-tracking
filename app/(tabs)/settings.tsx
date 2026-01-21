import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import Section from "@/components/Section";
import SettingsRow from "@/components/SettingsRow";
import ToggleButton from "@/components/ToggleButton";
import { AppIcons } from "@/constants/icon";
import React, { useState } from 'react';
import { ScrollView, Text } from "react-native";
import { scale } from "react-native-size-matters";

export function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}


const Settings = () => {

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  let userName = 'Firuz Nabiev';
  let age = 18;
  let currentWeight = 71.7;
  let waterGoal = 2400;
  let activityLevel = 'moderate';

  return (
    <ScreenBackgroundWrapper>
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
        <Section rounded className='mt-8 gap-[1px]'>
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
        </Section>

        <Section rounded title="Customization">
          <SettingsRow linkTo='/settings/personal-details' showHR icon={AppIcons.profileAdd}>
            <Text className="text-white text-[15px] font-poppins-medium">Personal details</Text>
          </SettingsRow>
          <SettingsRow linkTo='/settings/water-settings' showHR icon={AppIcons.droplet}>
            <Text className="text-white text-[15px] font-poppins-medium">Water settings</Text>
          </SettingsRow>
          <SettingsRow linkTo='/settings/activity-level' icon={AppIcons.activity}>
            <Text className="text-white text-[15px] font-poppins-medium">Activity level</Text>
          </SettingsRow>
        </Section>

        <Section rounded title="App Settings">
          <SettingsRow linkTo='/settings/my-account' showHR icon={AppIcons.profile}>
            <Text className="text-white text-[15px] font-poppins-medium">My account</Text>
          </SettingsRow>

          <SettingsRow 
            showHR 
            icon={AppIcons.bell}
            onPress={() => setNotificationsEnabled(prev => !prev)}
          >
            <Text className="text-white text-[15px] font-poppins-medium">Notifications</Text>
            <ToggleButton 
              isToggled={notificationsEnabled}
              onPress={() => setNotificationsEnabled(prev => !prev)}
            />
          </SettingsRow>

          <SettingsRow 
            showHR 
            icon={AppIcons.moon}
            onPress={() => setDarkModeEnabled(prev => !prev)}
          >
            <Text className="text-white text-[15px] font-poppins-medium">Dark mode</Text>
            <ToggleButton 
              isToggled={darkModeEnabled}
              onPress={() => setDarkModeEnabled(prev => !prev)}
            />
          </SettingsRow>
          
          <SettingsRow linkTo='/settings/privacy-policy' icon={AppIcons.lock}>
            <Text className="text-white text-[15px] font-poppins-medium">Privacy policy</Text>
          </SettingsRow>
        </Section>
      </ScrollView>
    </ScreenBackgroundWrapper>
  )
}

export default Settings