import ScreenBackgroundWrapper from '@/components/ScreenBackgroundWrapper'
import { constantColors, darkColors } from '@/constants/colors'
import { getUserSettings, saveUserSettings, UserSettings } from '@/services/storage'
import Slider from '@react-native-community/slider'
import React, { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const WaterSettings = () => {

  const maxValue = 5;
  const [sliderState, setSliderState] = useState<number>(2.4);
  const [userSettings, setUserSettings] = useState<UserSettings>({ recommendedWaterIntake: 2400, unit: 'ml' });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings();
        setUserSettings(settings);
        setSliderState(settings.recommendedWaterIntake / 1000); // Convert ml to liters for slider
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings when slider changes
  const handleSliderChange = async (value: number) => {
    setSliderState(value);
    const newSettings: UserSettings = {
      ...userSettings,
      recommendedWaterIntake: Math.round(value * 1000) // Convert liters to ml
    };
    setUserSettings(newSettings);

    try {
      await saveUserSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const resetToDefault = async () => {
    const defaultSettings: UserSettings = {
      recommendedWaterIntake: 2400,
      unit: 'ml'
    };
    setUserSettings(defaultSettings);
    setSliderState(2.4);

    try {
      await saveUserSettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

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
            onValueChange={handleSliderChange}
            minimumValue={0}
            maximumValue={maxValue}
            minimumTrackTintColor={constantColors.accent}
            maximumTrackTintColor={darkColors.secondary}
          />
        </View>
      </View>

      <View className='gap-[2px]'>
        <TouchableOpacity className='bg-dark-secondary px-5 py-6' onPress={resetToDefault}>
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