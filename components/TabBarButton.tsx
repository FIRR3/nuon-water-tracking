import { icon } from '@/constants/icon';
import { FONT_SIZES } from '@/constants/typography';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PlatformPressable } from '@react-navigation/elements';
import React, { useEffect } from 'react';
import { GestureResponderEvent } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const TabBarButton = ({ onPress, onLongPress, isFocused, routeName, color, label }: {
  onPress: (e: GestureResponderEvent) => void,
  onLongPress: (e: GestureResponderEvent) => void,
  isFocused: boolean,
  routeName: string,
  color: string,
  label: string
}) => {

  const colors = useThemeColors();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(
      typeof isFocused === 'boolean' ? (isFocused ? 1 : 0) : isFocused,
      {duration: 350}
    )
  }, [scale, isFocused])

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2]);
    const top = interpolate(scale.value, [0, 1], [0, 9]);

    return {
      transform: [{
        scale: scaleValue
      }],
      top
    }
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);

    return { opacity }
  });

  // Wrap handlers to accept both event types, but only handle GestureResponderEvent
  const handlePress = (e: GestureResponderEvent | any) => {
    if (e && e.nativeEvent && 'identifier' in e.nativeEvent) onPress(e);
  };
  const handleLongPress = (e: GestureResponderEvent | any) => {
    if (e && e.nativeEvent && 'identifier' in e.nativeEvent) onLongPress(e);
  };

  return (
    <PlatformPressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={{ flex: 1}}
      className='flex-1 justify-center items-center gap-[5px]'
    >
      <Animated.View style={animatedIconStyle as any}>
        {icon[routeName as keyof typeof icon]({
          color: isFocused ? colors.white : colors.primary
        })}
      </Animated.View>
      <Animated.Text style={[{ color: isFocused ? colors.accent : colors.primary, fontSize: FONT_SIZES.xs }, animatedTextStyle as any]}>
        {typeof label === 'string' ? label : String(label)}
      </Animated.Text>
    </PlatformPressable>
  )
}

export default TabBarButton