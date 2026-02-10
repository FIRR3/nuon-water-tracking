import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import React, { createContext, useContext, useEffect } from "react";
import { darkColors, lightColors } from "../constants/colors";

const THEME_STORAGE_KEY = "@nuon_theme_preference";

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorScheme, setColorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "dark" || saved === "light") {
          setColorScheme(saved);
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newScheme = isDark ? "light" : "dark";
    setColorScheme(newScheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newScheme);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
