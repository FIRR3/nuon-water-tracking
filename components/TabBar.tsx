import { useThemeColors } from "@/hooks/useThemeColors";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import TabBarButton from "./TabBarButton";

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {

  const colors = useThemeColors();

  const [dimensions, setDimensions] = useState({ height: 20, width: 270 });

  const buttonWidth = dimensions.width / state.routes.length;

  const tabPositionX = useSharedValue(0);

  const onTabbarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
    // Initialize position based on current active tab
    const initialWidth = e.nativeEvent.layout.width / state.routes.length;
    tabPositionX.value = initialWidth * state.index;
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPositionX.value }],
    };
  });

  // Sliding focus background animation for TabBarButtons
  useEffect(() => {
    tabPositionX.value = withSpring(buttonWidth * state.index, {
      damping: 10, // lower = more bounce
      stiffness: 100, // lower = softer spring
      mass: 1, // higher = slower bounce
      overshootClamping: false,
    });
  }, [state.index]);

  return (
    <View
      onLayout={onTabbarLayout}
      className="absolute bottom-[50px] flex-row justify-between items-center bg-white dark:bg-dark-secondary mx-[60px] py-[15px] rounded-[35px]"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 10,
        shadowOpacity: 0.2,
      }}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            position: "absolute",
            backgroundColor: colors.accent,
            borderRadius: 30,
            marginHorizontal: 12,
            height: dimensions.height - 15,
            width: buttonWidth - 25,
          },
        ]}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ? options.title : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TabBarButton
            key={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            color={isFocused ? colors.white : colors.primary}
            label={label}
          />
        );
      })}
    </View>
  );
}
