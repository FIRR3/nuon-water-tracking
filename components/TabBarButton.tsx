import { colors } from '@/constants/colors';
import { icon } from '@/constants/icon';
import { PlatformPressable } from '@react-navigation/elements';
import React, { useEffect } from 'react';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const TabBarButton = ({ onPress, onLongPress, isFocused, routeName, color, label }: {
  onPress: Function,
  onLongPress: Function,
  isFocused: boolean,
  routeName: string,
  color: string,
  label: string
}) => {

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

    return {
      opacity
    }
  });

  return (
    <PlatformPressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1}}
      className='flex-1 justify-center items-center gap-[5px]'
    >
      <Animated.View style={animatedIconStyle}>
        {icon[routeName]({
          color: isFocused ? "#FFF" : "#222"
        })}
      </Animated.View>
      <Animated.Text style={[{ color: isFocused ? colors.accent : "#222", fontSize: 12 }, animatedTextStyle]}>
        {label}
      </Animated.Text>
    </PlatformPressable>
  )
}

export default TabBarButton