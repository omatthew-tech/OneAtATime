import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path as SvgPath, Circle } from "react-native-svg";
import { colors, spacing, typography } from "../theme";

export function DiscoverIcon({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Circle cx="12" cy="12" r="10" />
      <SvgPath d="M14.5 9.5l-5 2 2 5 5-2z" fill={color} stroke="none" />
    </Svg>
  );
}

export function InsightsIcon({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <SvgPath d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MeIcon({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <SvgPath d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

export function MessageHeartIcon({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <SvgPath d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </Svg>
  );
}

const DEFAULT_TABS = [
  { key: "discover", label: "Discover", Icon: DiscoverIcon },
  { key: "matches", label: "Insights", Icon: InsightsIcon },
  { key: "me", label: "Me", Icon: MeIcon },
];

export default function BottomTabBar({ activeTab, onTabPress, tabs }) {
  const tabList = tabs || DEFAULT_TABS;

  return (
    <View style={styles.bar}>
      {tabList.map(({ key, label, Icon }) => {
        const active = activeTab === key;
        const tint = active ? colors.tealGlow : colors.textMuted;
        return (
          <Pressable key={key} style={styles.tab} onPress={() => onTabPress(key)}>
            <Icon color={tint} />
            <Text style={[styles.label, { color: tint }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.oceanDeep,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "600",
  },
});
