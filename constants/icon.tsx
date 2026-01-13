// constants/icons.ts
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';

// Type-safe icon props
export type IconProps = {
  size?: number;
  color?: string;
  style?: any;
};

// Tab Bar Icons (specific styling/size for tabs)
export const TabIcons = {
  index: (props: IconProps) => (
    <Feather name="droplet" size={24} {...props} />
  ),
  statistics: (props: IconProps) => (
    <Feather name="bar-chart-2" size={24} {...props} />
  ),
  settings: (props: IconProps) => (
    <Feather name="settings" size={24} {...props} />
  ),
} as const;

// UI Icons (buttons, actions, etc.)
export const UIIcons = {
  add: (props: IconProps) => (
    <Feather name="plus-circle" size={20} {...props} />
  ),
  remove: (props: IconProps) => (
    <Feather name="minus-circle" size={20} {...props} />
  ),
  close: (props: IconProps) => (
    <Feather name="x" size={20} {...props} />
  ),
  check: (props: IconProps) => (
    <Feather name="check" size={20} {...props} />
  ),
  chevronRight: (props: IconProps) => (
    <Feather name="chevron-right" size={20} {...props} />
  ),
  chevronLeft: (props: IconProps) => (
    <Feather name="chevron-left" size={20} {...props} />
  ),
} as const;

// Status Icons (indicators, notifications)
export const StatusIcons = {
  success: (props: IconProps) => (
    <Feather name="check-circle" size={24} color="#22c55e" {...props} />
  ),
  error: (props: IconProps) => (
    <Feather name="alert-circle" size={24} color="#ef4444" {...props} />
  ),
  warning: (props: IconProps) => (
    <Feather name="alert-triangle" size={24} color="#f59e0b" {...props} />
  ),
  info: (props: IconProps) => (
    <Feather name="info" size={24} color="#3b82f6" {...props} />
  ),
} as const;

// Water-related Icons (app-specific)
export const WaterIcons = {
  bottle: (props: IconProps) => (
    <MaterialIcons name="water-drop" size={24} {...props} />
  ),
  glass: (props: IconProps) => (
    <Ionicons name="wine" size={24} {...props} />
  ),
  droplet: (props: IconProps) => (
    <Feather name="droplet" size={24} {...props} />
  ),
} as const;

// Export all icons
export const Icons = {
  tab: TabIcons,
  ui: UIIcons,
  status: StatusIcons,
  water: WaterIcons,
} as const;