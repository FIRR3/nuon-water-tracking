import ScreenBackgroundWrapper from '@/components/ScreenBackgroundWrapper'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'

const PrivacyPolicy = () => {

  return (
    <ScreenBackgroundWrapper>
      <ScrollView showsVerticalScrollIndicator={false} className='mb-10 pt-10'>
        <Text className='text-white text-md font-poppins-semibold pl-5 mb-2'>Privacy Policy</Text>
        <View className='bg-dark-secondary p-5 gap-4'>
          <Text className='text-white text-sm font-poppins-semibold'>Last Updated: January 15, 2026</Text>
          
          <Text className='text-white text-sm'>
            Nuon Water Tracking is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our mobile application.
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>1. Information We Collect</Text>
          <Text className='text-white text-sm'>
            <Text className='font-poppins-semibold'>Account Information:</Text> We collect your email address, first name, last name, preferred language, and unit system when you create an account.
          </Text>
          <Text className='text-white text-sm'>
            <Text className='font-poppins-semibold'>Body Measurements:</Text> We collect and store your current weight, height, date of birth, gender, occupation, and activity level to calculate personalized water intake recommendations.
          </Text>
          <Text className='text-white text-sm'>
            <Text className='font-poppins-semibold'>Water Consumption Data:</Text> We receive and store data from your connected water bottle via Bluetooth, including the amount and timing of your water intake throughout the day.
          </Text>
          <Text className='text-white text-sm'>
            <Text className='font-poppins-semibold'>Device Information:</Text> We may collect device identifiers and Bluetooth connection data necessary for connecting to your water bottle.
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>2. How We Use Your Information</Text>
          <Text className='text-white text-sm'>
            • To calculate and provide personalized daily water intake recommendations{'\n'}
            • To track and display your water consumption progress{'\n'}
            • To send reminder notifications to help you stay hydrated{'\n'}
            • To maintain and improve app functionality{'\n'}
            • To connect your device to your water bottle via Bluetooth{'\n'}
            • To provide statistics and insights about your hydration habits
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>3. Medical Disclaimer</Text>
          <Text className='text-white text-sm'>
            We are not a medical company and do not provide medical advice. Our water intake recommendations are general suggestions based on the personal information you provide and are not a substitute for professional medical advice. Please consult with a healthcare provider for personalized medical guidance regarding your hydration needs.
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>4. Data Storage and Security</Text>
          <Text className='text-white text-sm'>
            Your personal information and body measurements are securely stored in our database. We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure. However, no method of electronic storage is 100% secure.
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>5. Bluetooth Connectivity</Text>
          <Text className='text-white text-sm'>
            Our app uses Bluetooth to connect with your water bottle and receive consumption data. Bluetooth data is transmitted locally between your device and water bottle and is not shared with third parties.
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>6. Notifications</Text>
          <Text className='text-white text-sm'>
            We send push notifications to remind you to drink water based on your preferences. You can disable notifications at any time through your device settings or app notification preferences.
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>7. Data Sharing</Text>
          <Text className='text-white text-sm'>
            We do not sell, rent, or share your personal information with third parties for marketing purposes. Your data is used solely to provide and improve our water tracking services.
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>8. Your Rights</Text>
          <Text className='text-white text-sm'>
            You have the right to:{'\n'}
            • Access your personal data stored in our database{'\n'}
            • Update or correct your information at any time{'\n'}
            • Delete your account and all associated data{'\n'}
            • Opt out of notifications
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>9. Data Retention</Text>
          <Text className='text-white text-sm'>
            We retain your personal information for as long as your account is active. If you delete your account, all your personal data will be permanently removed from our database.
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>10. Changes to This Policy</Text>
          <Text className='text-white text-sm'>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes through the app or via email. Continued use of the app after changes constitutes acceptance of the updated policy.
          </Text>

          <Text className='text-white text-sm font-poppins-semibold mt-2'>11. Contact Us</Text>
          <Text className='text-white text-sm'>
            If you have questions about this Privacy Policy or how we handle your data, please contact us at firnab23@varmdogymnasium.se
          </Text>
        </View>
      </ScrollView>
    </ScreenBackgroundWrapper>
  )
}

export default PrivacyPolicy