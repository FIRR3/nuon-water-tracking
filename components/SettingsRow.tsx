import { IconProps, UIIcons } from '@/constants/icon';
import { Href, Link } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { scale } from 'react-native-size-matters';

type SettingsRowProps = {
  children: React.ReactNode;
  linkTo?: Href;
  showHR?: boolean;
  icon?: React.ComponentType<IconProps>;
  onPress?: () => void;
}

export const SettingsRow = ({children, linkTo, showHR = false, icon: Icon, onPress}: SettingsRowProps) => {

  if (linkTo) {
    return (
      <>
        <Link href={linkTo} asChild>
          <TouchableOpacity style={{ height: scale(35) }} className={`flex-row justify-between items-center w-full ${Icon && 'pl-9'}`}>
            {Icon && <Icon style={{ position: 'absolute' }} />}
            {children}
            <UIIcons.chevronRight/>
          </TouchableOpacity>
        </Link>
        {showHR && <View className="h-[1px] bg-white w-full"></View>}
      </>
    )
  }

  else if (onPress) {
      return (
        <>
          <TouchableOpacity style={{ height: scale(35) }} onPress={onPress} className={`flex-row justify-between items-center w-full ${Icon && 'pl-9'}`}>
            {Icon && <Icon style={{ position: 'absolute' }} />}
            {children}
          </TouchableOpacity>  
          {showHR && <View className="h-[1px] bg-white w-full"></View>}
        </>
      )
  }

  return(
    <>
      <View style={{ height: scale(35) }} className={`flex-row justify-between items-center w-full min-h-6 ${Icon && 'pl-9'}`}>
        {Icon && <Icon style={{ position: 'absolute' }} />}
        {children}
      </View>
      {showHR && <View className="h-[1px] bg-white w-full"></View>}
    </>
  )
}

export default SettingsRow