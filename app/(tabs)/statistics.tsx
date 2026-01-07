import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import React from 'react';
import { Text } from 'react-native';

const Statistics = () => {
  return (
    <ScreenBackgroundWrapper style={{ justifyContent: "center", alignItems: "center" }}>
      <Text className='text-5xl text-white'>Stats</Text>
    </ScreenBackgroundWrapper>
  )
}

export default Statistics