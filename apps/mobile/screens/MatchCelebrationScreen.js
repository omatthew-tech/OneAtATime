import { useEffect } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing, typography, lineHeights, radius } from "../theme";
import FishIcon from "../components/FishIcon";

export default function MatchCelebrationScreen({ matchedProfile, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Pressable style={styles.container} onPress={onDismiss}>
      <View style={styles.content}>
        <FishIcon size={72} pulse color={colors.tealGlow} />
        <Text style={styles.heading}>It's a match!</Text>
        <Image
          source={{ uri: matchedProfile.photos[0] }}
          style={styles.photo}
        />
        <Text style={styles.name}>{matchedProfile.name}</Text>
        <Text style={styles.hint}>Tap anywhere to continue</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 22, 40, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  content: {
    alignItems: "center",
    gap: spacing.md,
  },
  heading: {
    fontSize: typography.h1,
    lineHeight: lineHeights.h1,
    fontWeight: "800",
    color: colors.tealGlow,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.tealGlow,
  },
  name: {
    fontSize: typography.title,
    lineHeight: lineHeights.title,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  hint: {
    fontSize: typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
