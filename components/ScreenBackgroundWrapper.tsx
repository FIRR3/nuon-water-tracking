import { darkColors } from "@/constants/colors";
import React, { ReactNode } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

interface ScreenBackgroundWrapperProps {
  children: ReactNode;
  dismissKeyboard?: boolean;
  className?: string;
}

const ScreenBackgroundWrapper = ({
  children,
  dismissKeyboard = false,
  className = "",
}: ScreenBackgroundWrapperProps) => {
  const content = (
    <SafeAreaProvider
      style={{ backgroundColor: darkColors.background }}
      className={`flex-1 ${className}`}
    >
      <View className="flex-1">{children}</View>
    </SafeAreaProvider>
  );

  if (dismissKeyboard) {
    return (
      <TouchableWithoutFeedback
        style={{ backgroundColor: darkColors.background }}
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
};

export default ScreenBackgroundWrapper;
