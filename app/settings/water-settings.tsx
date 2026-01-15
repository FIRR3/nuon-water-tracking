import ScreenBackgroundWrapper from '@/components/ScreenBackgroundWrapper'
import { constantColors, darkColors } from '@/constants/colors'
import Slider from '@react-native-community/slider'
import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const WaterSettings = () => {

  const recommendedWaterIntake = 2.4;
  const maxValue = 5;

  const [sliderState, setSliderState] = useState<number>(recommendedWaterIntake);

  return (
    <ScreenBackgroundWrapper className='pt-10 gap-28'>
      <View className='gap-12 px-5'>
        <Text className='text-white text-sm font-poppins'>
          Do you feel like your calculated amount of water is not enough or too much for you?
        </Text>
        <Text className='text-white text-sm font-poppins'>Change you recommended amount here:</Text>
      </View>

      <View className=' gap-8 px-5 w-full'>
        <Text className='text-white text-md font-poppins-semibold text-center'>Daily goal</Text>
        <View className='w-full'>
          <Text
            style={{
              alignSelf: 'flex-start',
              left: `${sliderState/maxValue * 100}%`,
              transform: [{ translateX: `${sliderState/maxValue*-100}%`, }]
            }}
            className='text-white text-sm font-poppins-semibold'
          >
            {(sliderState).toFixed(1) + 'L'}
          </Text>
          <Slider
            value={sliderState}
            onValueChange={(value) => setSliderState(value)}
            minimumValue={0}
            maximumValue={maxValue}
            minimumTrackTintColor={constantColors.accent}
            maximumTrackTintColor={darkColors.secondary}
          />
        </View>
      </View>

      <View className='gap-[2px]'>
        <TouchableOpacity className='bg-dark-secondary px-5 py-6'>
          <Text className='text-red-600 font-poppins text-center'>Reset to app recommendation</Text>
        </TouchableOpacity>
        <TouchableOpacity className='bg-dark-secondary px-5 py-6'>
          <Text className='text-dark-accent font-poppins text-center'>Confirm new water amount</Text>
        </TouchableOpacity>
      </View>
    </ScreenBackgroundWrapper>
  )
}

export default WaterSettings