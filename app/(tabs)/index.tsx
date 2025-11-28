import { LiquidProgressGauge } from '@/components/LiquidProgressGauge';
import React from "react";
import { Dimensions, View } from "react-native";

export default function Index() {

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  return (
    <View className="flex-1 items-center justify-center">
      <LiquidProgressGauge width={400} height={500} value={50}/>
    </View>
  );
}
