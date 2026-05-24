// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "map.fill": "map",
  "leaf.fill": "eco",
  "timer": "timer",
  "chart.bar.fill": "bar-chart",
  "plus.circle.fill": "add-circle",
  "xmark.circle.fill": "cancel",
  "checkmark.circle.fill": "check-circle",
  "arrow.clockwise": "refresh",
  "info.circle": "info",
  "gearshape.fill": "settings",
  "star.fill": "star",
  "bolt.fill": "bolt",
  "hammer.fill": "build",
  "building.2.fill": "business",
  "tree.fill": "park",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
