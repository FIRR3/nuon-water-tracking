// components/Header.tsx
import { useTheme } from "@/components/ThemeContext";
import { UIIcons } from "@/constants/icon";
import { FONT_SIZES } from "@/constants/typography";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale } from "react-native-size-matters";

type Props = {
  title: string;
  showBack?: boolean;
};

const Header = ({ title, showBack = false }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        height: scale(55) + insets.top,
        backgroundColor: colors.secondary,
        paddingTop: insets.top,
        justifyContent: "center",
        paddingBottom: scale(10),
        paddingHorizontal: scale(16),
        flexDirection: "row",
        alignItems: "flex-end",
        position: "relative",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: isDark ? 10 : 4 },
        shadowRadius: 10,
        shadowOpacity: 0.1,
      }}
    >
      {/* Back button */}
      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: "absolute",
            left: scale(16),
            bottom: scale(15),
          }}
        >
          <UIIcons.chevronLeft
            color={colors.primary}
            size={Math.round(FONT_SIZES.lg)}
          />
        </TouchableOpacity>
      )}

      {/* Title */}
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: Math.round(FONT_SIZES.lg),
          color: colors.primary,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </View>
  );
};

export default Header;
