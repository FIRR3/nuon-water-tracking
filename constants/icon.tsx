// constants/icons.ts
import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
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
  arrowRight: (props: IconProps) => (
    <Feather name="arrow-right" size={20} color="white" {...props} />
  ),
  arrowLeft: (props: IconProps) => (
    <Feather name="arrow-left" size={20} color="white" {...props} />
  ),
  arrowUpRight: (props: IconProps) => (
    <Feather name="arrow-up-right" size={20} color="white" {...props} />
  ),
  arrowDownLeft: (props: IconProps) => (
    <Feather name="arrow-down-left" size={20} color="white" {...props} />
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
  dropletFilled: (props: IconProps) => {
    const size = props.size || 20;
    const color = props.color || "white";
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={props.style}
      >
        <Path
          d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
          fill={color}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  },
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
  fire: (props: IconProps) => {
    const size = props.size || 20;
    const color = props.color || constantColors.orange;
    const circleSize = size * 0.6;
    // Use a larger container and center everything with flexbox
    return (
      <View
        style={{
          width: size,
          height: size * 1.25,
        }}
        {...props}
      >
        <Svg
          width={circleSize}
          height={circleSize}
          style={{
            position: "absolute",
            top: size * 0.35,
            left: (size - circleSize) / 2,
          }}
        >
          <Path
            d={`M${circleSize / 2},${circleSize / 2} m-${circleSize / 2},0 a${circleSize / 2},${circleSize / 2} 0 1,0 ${circleSize},0 a${circleSize / 2},${circleSize / 2} 0 1,0 -${circleSize},0`}
            fill={constantColors.yellow}
          />
        </Svg>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size * 1.25,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FontAwesome6 name="fire" size={size} color={constantColors.orange} />
        </View>
      </View>
    );
  },
} as const;

// Export all icons
export const Icons = {
  tab: TabIcons,
  ui: UIIcons,
  status: StatusIcons,
  app: AppIcons,
} as const;
