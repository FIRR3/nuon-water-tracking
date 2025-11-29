import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';

export function useThemeColors() {
  const scheme = useColorScheme();
  scheme ?? 'light'; // if useColorScheme returns null, we can still have our default
  
  return scheme === 'dark' ? darkColors : lightColors;
}