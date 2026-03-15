import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import ProgressBar from "./ProgressBar";
import { colors, spacing, typography, lineHeights, radius, sizes } from "../theme";

export default function OnboardingLayout({
  step,
  totalSteps,
  title,
  canContinue,
  onBack,
  onNext,
  children,
  dismissKeyboard = false,
}) {
  const content = (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.top}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backChevron}>{"‹"}</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <ProgressBar step={step} totalSteps={totalSteps} />

          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.body}>{children}</View>

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              canContinue ? styles.nextActive : styles.nextDisabled,
              pressed && canContinue && styles.nextPressed,
            ]}
            onPress={canContinue ? onNext : undefined}
            disabled={!canContinue}
          >
            <Text
              style={[
                styles.nextText,
                canContinue ? styles.nextTextActive : styles.nextTextDisabled,
              ]}
            >
              Next
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );

  if (dismissKeyboard) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.root}
        >
          {content}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    );
  }

  return <View style={styles.root}>{content}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.oceanAbyss,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  top: {
    gap: spacing.md,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xxs,
  },
  backChevron: {
    fontSize: 28,
    color: colors.tealGlow,
    lineHeight: 28,
    marginTop: -2,
  },
  backText: {
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  title: {
    fontSize: typography.title,
    lineHeight: lineHeights.title,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  body: {
    flex: 1,
    paddingTop: spacing.md,
  },
  bottom: {
    paddingTop: spacing.sm,
  },
  nextButton: {
    width: "100%",
    height: sizes.buttonHeightLg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  nextActive: {
    backgroundColor: colors.tealGlow,
  },
  nextDisabled: {
    backgroundColor: colors.oceanDeep,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  nextTextActive: {
    color: colors.oceanAbyss,
  },
  nextTextDisabled: {
    color: colors.textMuted,
  },
});
