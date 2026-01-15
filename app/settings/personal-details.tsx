import ScreenBackgroundWrapper from '@/components/ScreenBackgroundWrapper'
import SettingsRow from '@/components/SettingsRow'
import React from 'react'
import { Text, View } from 'react-native'

const PersonalDetails = () => {

  const currentWeight = 72;
  const height = 1.81;
  const dateOfBirth = '2007-08-12';
  const gender = 'Male';
  const activityLevel = 'Moderate';

  return (
    <ScreenBackgroundWrapper className='pt-10'>
      <View className='px-5'>
        <Text className='text-white text-md font-poppins-semibold'>Your info</Text>
        <Text className='text-white text-sm font-poppins'>This is what we use to calculate your daily water intake.</Text>
      </View>
      <View className='mt-5 bg-dark-secondary px-5 py-5 gap-5'>
        <SettingsRow showHR>
          <Text className='text-white text-[15px] font-poppins-medium'>Current weight</Text>
          <Text className='text-white text-[15px] font-poppins-semibold'>{currentWeight}kg</Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className='text-white text-[15px] font-poppins-medium'>Height</Text>
          <Text className='text-white text-[15px] font-poppins-semibold'>{height}m</Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className='text-white text-[15px] font-poppins-medium'>Date of birth</Text>
          <Text className='text-white text-[15px] font-poppins-semibold'>{dateOfBirth.replaceAll('-', ' / ')}</Text>
        </SettingsRow>
        <SettingsRow showHR>
          <Text className='text-white text-[15px] font-poppins-medium'>Gender</Text>
          <Text className='text-white text-[15px] font-poppins-semibold'>{gender}</Text>
        </SettingsRow>
        <SettingsRow>
          <Text className='text-white text-[15px] font-poppins-medium'>Activity level</Text>
          <Text className='text-white text-[15px] font-poppins-semibold'>{activityLevel}</Text>
        </SettingsRow>
      </View>
    </ScreenBackgroundWrapper>
  )
}

export default PersonalDetails