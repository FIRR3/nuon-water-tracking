import { useThemeColors } from "@/hooks/useThemeColors";
import React from "react";
import { View, ViewProps } from "react-native";

export default function ScreenBackgroundWrapper({ children, style, ...props }: ViewProps) {
  const colors = useThemeColors();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background}, style]} {...props}>
      {children}
    </View>
  );
}
