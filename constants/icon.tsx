// constants/icons.ts
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { constantColors } from "./colors";

// Type-safe icon props
export type IconProps = {
  size?: number;
  color?: string;
  style?: any;
};

// Tab Bar Icons (specific styling/size for tabs)
export const TabIcons = {
  index: (props: IconProps) => (
    <Feather name="droplet" size={24} color="white" {...props} />
  ),
  statistics: (props: IconProps) => (
    <Feather name="bar-chart-2" size={24} color="white" {...props} />
  ),
  settings: (props: IconProps) => (
    <Feather name="settings" size={24} color="white" {...props} />
  ),
} as const;

// UI Icons (buttons, actions, etc.)
export const UIIcons = {
  add: (props: IconProps) => (
    <Feather name="plus-circle" size={24} color="white" {...props} />
  ),
  remove: (props: IconProps) => (
    <Feather name="minus-circle" size={24} color="white" {...props} />
  ),
  close: (props: IconProps) => (
    <Feather name="x" size={24} color="white" {...props} />
  ),
  chevronRight: (props: IconProps) => (
    <Feather name="chevron-right" size={20} color="white" {...props} />
  ),
  chevronLeft: (props: IconProps) => (
    <Feather name="chevron-left" size={20} color="white" {...props} />
  ),
  toggleLeft: (props: IconProps) => (
    <Ionicons
      name="toggle-outline"
      size={20}
      color="white"
      {...props}
      style={[{ transform: [{ rotate: "180deg" }] }, props.style]}
    />
  ),
  toggleRight: (props: IconProps) => (
    <Ionicons
      name="toggle"
      size={20}
      color={constantColors.accent}
      {...props}
    />
  ),
  checked: (props: IconProps) => (
    <Ionicons
      name="checkmark-circle"
      size={20}
      color={constantColors.accent}
      {...props}
    />
  ),
  unChecked: (props: IconProps) => (
    <Ionicons
      name="checkmark-circle-outline"
      size={20}
      color={constantColors.accent}
      {...props}
    />
  ),
  edit: (props: IconProps) => (
    <Feather name="edit-2" size={20} color="white" {...props} />
  ),
} as const;

// Status Icons (indicators, notifications)
export const StatusIcons = {
  success: (props: IconProps) => (
    <Feather name="check-circle" size={24} color="white" {...props} />
  ),
  error: (props: IconProps) => (
    <Feather name="alert-circle" size={24} color="white" {...props} />
  ),
  warning: (props: IconProps) => (
    <Feather name="alert-triangle" size={24} color="white" {...props} />
  ),
  info: (props: IconProps) => (
    <Feather name="info" size={24} color="white" {...props} />
  ),
} as const;

// App Icons (app-specific)
export const AppIcons = {
  profileAdd: (props: IconProps) => (
    <Feather name="user-plus" size={20} color="white" {...props} />
  ),
  droplet: (props: IconProps) => (
    <Feather name="droplet" size={20} color="white" {...props} />
  ),
  activity: (props: IconProps) => (
    <MaterialIcons name="directions-run" size={20} color="white" {...props} />
  ),
  profile: (props: IconProps) => (
    <Feather name="user" size={20} color="white" {...props} />
  ),
  bell: (props: IconProps) => (
    <Feather name="bell" size={20} color="white" {...props} />
  ),
  moon: (props: IconProps) => (
    <Feather name="moon" size={20} color="white" {...props} />
  ),
  lock: (props: IconProps) => (
    <Feather name="lock" size={20} color="white" {...props} />
  ),
} as const;

// Export all icons
export const Icons = {
  tab: TabIcons,
  ui: UIIcons,
  status: StatusIcons,
  app: AppIcons,
} as const;
