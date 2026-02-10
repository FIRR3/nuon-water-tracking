import { useTheme } from "@/components/ThemeContext";
import { constantColors } from "@/constants/colors";

export function useThemeColors() {
  const { colors } = useTheme();
  return { ...colors, ...constantColors };
}
