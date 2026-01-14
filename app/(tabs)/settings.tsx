import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { AppIcons, IconProps, UIIcons } from "@/constants/icon";
import { Href, Link } from "expo-router";
import React from 'react';
import { Text, TouchableOpacity, View } from "react-native";
import { scale } from "react-native-size-matters";

function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

type SettingsRowProps = {
  children: React.ReactNode;
  linkTo?: Href;
  showHR?: boolean;
  icon?: React.ComponentType<IconProps>;
}

const SettingsRow = ({children, linkTo, showHR = false, icon: Icon}: SettingsRowProps) => {

  if (linkTo) {
    return (
      <>
        <Link href={linkTo} asChild>
          <TouchableOpacity className={`flex-row justify-between items-center w-full ${Icon && 'pl-10'}`}>
            {Icon && <Icon style={{ position: 'absolute' }} />}
            {children}
            <UIIcons.chevronRight/>
          </TouchableOpacity>
        </Link>
        {showHR && 
          <View className="h-[1px] bg-white w-full"></View>
        }
      </>
    )
  }

  return(
    <>
      <View className={`flex-row justify-between items-center w-full ${Icon && 'pl-10'}`}>
        {Icon && <Icon style={{ position: 'absolute' }} />}
        {children}
      </View>
      {showHR && 
        <View className="h-[1px] bg-white w-full"></View>
      }
    </>
  )
}

const Settings = () => {

  let userName = 'Firuz Nabiev';
  let age = 18;
  let currentWeight = 71.7;
  let waterGoal = 2400;
  let activityLevel = 'moderate';

  return (
    <ScreenBackgroundWrapper style={{ paddingInline: scale(20) }}>
      <View className="flex flex-col mt-8 bg-dark-secondary rounded-xl px-5 py-4 gap-4">
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

      <View className="flex flex-col mt-8 bg-dark-secondary rounded-xl px-5 py-4 gap-4">
        <SettingsRow showHR icon={AppIcons.profileAdd}>
          <Text className="text-white text-[15px] font-poppins-medium">Personal details</Text>
        </SettingsRow>
        <SettingsRow showHR icon={AppIcons.droplet}>
          <Text className="text-white text-[15px] font-poppins-medium">Water settings</Text>
        </SettingsRow>
        <SettingsRow showHR icon={AppIcons.activity}>
          <Text className="text-white text-[15px] font-poppins-medium">Activity level</Text>
        </SettingsRow>
      </View>

      <View className="flex flex-col mt-8 bg-dark-secondary rounded-xl px-5 py-4 gap-4">
        <SettingsRow showHR icon={AppIcons.profile}>
          <Text className="text-white text-[15px] font-poppins-medium">My account</Text>
        </SettingsRow>
        <SettingsRow showHR icon={AppIcons.bell}>
          <Text className="text-white text-[15px] font-poppins-medium">Notifications</Text>
        </SettingsRow>
        <SettingsRow showHR icon={AppIcons.moon}>
          <Text className="text-white text-[15px] font-poppins-medium">Dark mode</Text>
        </SettingsRow>
        <SettingsRow showHR icon={AppIcons.lock}>
          <Text className="text-white text-[15px] font-poppins-medium">Privacy policy</Text>
        </SettingsRow>
      </View>
    </ScreenBackgroundWrapper>
  )
}

export default Settings