import { Feather } from '@expo/vector-icons';

export const icon = {
  settings: (props: any) => (
    <Feather name='settings' size={24} {...props} />
  ),
  index: (props: any) => (
    <Feather name='droplet' size={24} {...props} />
  ),
  statistics: (props: any) => (
    <Feather name='bar-chart-2' size={24} {...props} />
  ),
};