import { IconProps, UIIcons } from "@/constants/icon";
import { Href, Link } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { scale } from "react-native-size-matters";
import { useTheme } from "./ThemeContext";

type SettingsRowProps = {
  children: React.ReactNode;
  linkTo?: Href;
  showHR?: boolean;
  icon?: React.ComponentType<IconProps>;
  onPress?: () => void;
};

export const SettingsRow = ({
  children,
  linkTo,
  showHR = false,
  icon: Icon,
  onPress,
}: SettingsRowProps) => {
  const { colors, isDark } = useTheme();

  if (linkTo) {
    // Link
    return (
      <>
        <Link href={linkTo} asChild>
          <TouchableOpacity
            style={{ height: scale(35) }}
            className={`flex-row justify-between items-center w-full ${Icon && "pl-9"}`}
          >
            {Icon && (
              <Icon color={colors.primary} style={{ position: "absolute" }} />
            )}
            {children}
            <UIIcons.chevronRight color={colors.primary} />
          </TouchableOpacity>
        </Link>
        {showHR && (
          <View className="h-[1px] bg-light-primary/10 dark:bg-white/15 w-full"></View>
        )}
      </>
    );
  } else if (onPress) {
    return (
      // Button
      <>
        <TouchableOpacity
          style={{ height: scale(35) }}
          onPress={onPress}
          className={`flex-row justify-between items-center w-full ${Icon && "pl-9"}`}
        >
          {Icon && (
            <Icon color={colors.primary} style={{ position: "absolute" }} />
          )}
          {children}
        </TouchableOpacity>
        {showHR && (
          <View className="h-[1px] bg-light-primary/10 dark:bg-white/15 w-full"></View>
        )}
      </>
    );
  }

  return (
    // Normal display
    <>
      <View
        style={{ height: scale(35) }}
        className={`flex-row justify-between items-center w-full min-h-6 ${Icon && "pl-9"}`}
      >
        {Icon && (
          <Icon color={colors.primary} style={{ position: "absolute" }} />
        )}
        {children}
      </View>
      {showHR && (
        <View className="h-[1px] bg-light-primary/10 dark:bg-white/15 w-full"></View>
      )}
    </>
  );
};

export default SettingsRow;
