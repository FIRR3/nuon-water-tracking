import React from "react";
import { Text, View } from "react-native";

type Props = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  rounded?: boolean;
};

const Section = ({ title, children, rounded, className, ...props }: Props) => {
  if (title) {
    return (
      <View className={`${className}`}>
        <Text className="text-light-primary dark:text-dark-primary text-md font-poppins-semibold mb-[6px]">
          {title}
        </Text>
        <View
          className={`flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 py-3 gap-3 ${rounded && "rounded-xl"}`}
          {...props}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      className={`flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 py-3 gap-3 ${rounded && "rounded-xl"} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};

export default Section;
