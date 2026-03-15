import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, spacing, typography, lineHeights, radius } from "../theme";

function BittenFishIcon({ size = 100, color = colors.textMuted }) {
  const w = size;
  const h = size / 2;
  return (
    <Svg width={w} height={h} viewBox="0 0 100 50" fill="none" stroke={color} strokeWidth={2}>
      <Path
        d="M 10 25 Q 30 5, 55 15 L 48 22 L 55 28 Q 50 30, 55 35 Q 30 45, 10 25 M 75 25 L 95 15 M 75 25 L 95 35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="25" cy="22" r="4" strokeWidth="2" />
    </Svg>
  );
}

export default function ErrorOverlay({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <BittenFishIcon />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          {message || "Check your connection and try again"}
        </Text>
        {onRetry && (
          <Pressable style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.oceanAbyss,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    lineHeight: lineHeights.title,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.tealGlow,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxxl,
  },
  retryText: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.oceanAbyss,
  },
});
