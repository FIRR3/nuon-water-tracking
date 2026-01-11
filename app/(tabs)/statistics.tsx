import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import React from 'react';
import { Text } from 'react-native';
import WeightScreen from "@/components/weight_tester";

const Statistics = () => {
  return (
    <ScreenBackgroundWrapper style={{ justifyContent: "center", alignItems: "center" }}>
      <Text className='text-5xl text-white'>Stats</Text>
      <WeightScreen />
      
    </ScreenBackgroundWrapper>
  )
}

export default Statistics