import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import React from 'react';
import { Text } from 'react-native';

const Settings = () => {
  return (
    <ScreenBackgroundWrapper style={{ justifyContent: "center", alignItems: "center" }}>
      <Text className='text-5xl text-white'>Settings</Text>
    </ScreenBackgroundWrapper>
  )
}

export default Settings