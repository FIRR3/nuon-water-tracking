import { constantColors, darkColors, lightColors } from '@/constants/colors';
import { useColorScheme } from 'react-native';

export function useThemeColors() {
  const scheme = useColorScheme();
  scheme ?? 'light'; // if useColorScheme returns null, we can still have our default
  
  return scheme === 'dark' ?
  {...darkColors, ...constantColors}
  :
  {...lightColors, ...constantColors};
}