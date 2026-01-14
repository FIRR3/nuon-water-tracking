// components/Header.tsx
import { constantColors, darkColors } from '@/constants/colors';
import { UIIcons } from '@/constants/icon';
import { FONT_SIZES } from '@/constants/typography';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale } from 'react-native-size-matters';

type Props = {
  title: string;
  showBack?: boolean;
}

const Header = ({ title, showBack = false }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={{
        height: scale(60) + insets.top, // Header height + status bar
        backgroundColor: darkColors.secondary,
        paddingTop: insets.top, // Push content below status bar
        justifyContent: 'center', // Align content to bottom
        paddingBottom: scale(13), // Distance from bottom
        paddingHorizontal: scale(16),
        flexDirection: 'row',
        alignItems: 'flex-end',
        position: 'relative',
      }}
    >
      {/* Back button */}
      {showBack && (
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ 
            position: 'absolute',
            left: scale(16),
            bottom: scale(15),
          }}
        >
          <UIIcons.chevronLeft color={constantColors.white} size={Math.round(FONT_SIZES.lg)}/>
        </TouchableOpacity>
      )}
      
      {/* Title */}
      <Text
        style={{
          fontFamily: 'Poppins-SemiBold',
          fontSize: Math.round(FONT_SIZES.lg),
          color: constantColors.white,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </View>
  );
};

export default Header;