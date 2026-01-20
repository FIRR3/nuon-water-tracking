import React, { ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaFrameContext, SafeAreaProvider } from "react-native-safe-area-context";

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
    <SafeAreaProvider className={`flex-1 bg-dark-primary ${className}`}>
      <View className="flex-1">{children}</View>
    </SafeAreaProvider>
  );

  if (dismissKeyboard) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
};

export default ScreenBackgroundWrapper;