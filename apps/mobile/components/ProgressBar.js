import { View, StyleSheet } from "react-native";
import FishIcon from "./FishIcon";
import { colors, spacing } from "../theme";

export default function ProgressBar({ step, totalSteps }) {
  const progress = step / totalSteps;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <FishIcon size={24} color={colors.tealGlow} flipHorizontal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: colors.oceanMid,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.tealGlow,
    borderRadius: 2,
  },
});
