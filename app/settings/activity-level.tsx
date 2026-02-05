import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { UIIcons } from "@/constants/icon";
import { useUserStore } from "@/hooks/useUserStore";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { scale } from "react-native-size-matters";

const ActivityLevel = () => {
  const { healthProfile, updateHealthProfile } = useUserStore();

  const activityLevel = healthProfile?.activityLevel;

  const [selectedLifestyle, setSelectedLifestyle] =
    useState<string>(activityLevel);

  useEffect(() => {
    const updateLifestyle = async () => {
      try {
        updateHealthProfile({ activityLevel: selectedLifestyle });
      } catch (error) {
        console.log("Error updating activity level");
      }
    };

    updateLifestyle();
  }, [selectedLifestyle]);

  const lifestyleOptions = [
    {
      id: "Sedentary",
      description:
        "Little to no daily activity or exercise. Desk job or student lifestyle. Mostly inactive with occasional light walking.",
    },
    {
      id: "Moderate",
      description:
        "Light daily activity with moderate exercise 3-5 days per week. Regular walking, cycling, or similar activities throughout the day.",
    },
    {
      id: "High",
      description:
        "Physically active throughout the day with intense exercise 6-7 days per week. Active job or consistent high-intensity training.",
    },
  ];

  return (
    <ScreenBackgroundWrapper className="pt-10">
      <Text className="text-white text-md font-poppins-semibold pl-5 mb-2 mt-10">
        Everyday lifestyle
      </Text>

      <View className="bg-dark-secondary px-5 py-7 gap-6">
        {lifestyleOptions.map((option, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              key={option.id}
              onPress={() => setSelectedLifestyle(option.id)}
              className="gap-1 relative pl-11"
            >
              {selectedLifestyle == option.id ? (
                <UIIcons.checked
                  size={scale(28)}
                  style={{ position: "absolute" }}
                />
              ) : (
                <UIIcons.unChecked
                  size={scale(28)}
                  style={{ position: "absolute" }}
                />
              )}
              <Text className="text-white text-sm font-poppins-semibold">
                {option.id}
              </Text>
              <Text className="text-white text-sm font-poppins">
                {option.description}
              </Text>
            </TouchableOpacity>

            {index !== lifestyleOptions.length - 1 && (
              <View className="bg-white h-[1px]"></View>
            )}
          </React.Fragment>
        ))}
      </View>
    </ScreenBackgroundWrapper>
  );
};

export default ActivityLevel;
