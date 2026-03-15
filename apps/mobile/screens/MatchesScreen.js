import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography, lineHeights } from "../theme";
import FishIcon from "../components/FishIcon";

export default function MatchesScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <FishIcon size={64} color={colors.textMuted} />
          <Text style={styles.title}>Dating Insights</Text>
          <Text style={styles.subtitle}>
            Coming soon — dating insights will tell you more about your type, messaging habits and other useful tips
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.oceanAbyss,
  },
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    lineHeight: lineHeights.title,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
