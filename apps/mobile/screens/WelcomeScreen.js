import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import FishIcon from "../components/FishIcon";
import { colors, spacing, typography, lineHeights, radius, sizes } from "../theme";

export default function WelcomeScreen({ initialName = "", onNext, onUpdate, onLoginPress }) {
  const [name, setName] = useState(initialName);
  const canContinue = name.trim().length > 0;

  function handleChangeName(text) {
    setName(text);
    onUpdate?.({ name: text });
  }

  function handleNext() {
    if (canContinue) onNext({ name: name.trim() });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />

        <SafeAreaView style={styles.safeTop}>
          <View style={styles.topBar}>
            <View style={styles.topBarSpacer} />
            <Pressable onPress={onLoginPress}>
              <Text style={styles.loginLink}>Login</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inner}
        >
          <View style={styles.brandArea}>
            <Text style={styles.brandName}>OneAtATime</Text>
            <FishIcon size={100} pulse />
          </View>

          <View style={styles.formArea}>
            <Text style={styles.prompt}>
              Join now.{"\n"}What's your name?
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={handleChangeName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [
                styles.nextButton,
                canContinue ? styles.nextActive : styles.nextDisabled,
                pressed && canContinue && styles.nextPressed,
              ]}
              onPress={handleNext}
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

            <Text style={styles.legal}>
              By continuing, you agree to our{" "}
              <Text style={styles.legalLink}>Terms</Text>,{" "}
              <Text style={styles.legalLink}>Privacy Policy</Text> and{"\n"}
              <Text style={styles.legalLink}>Community Guidelines</Text>.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.oceanAbyss,
  },
  safeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  topBarSpacer: {
    flex: 1,
  },
  loginLink: {
    fontSize: typography.body,
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
  },
  inner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.hero,
    paddingBottom: spacing.xxl,
  },
  brandArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  brandName: {
    fontSize: typography.h1,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  formArea: {
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  prompt: {
    fontSize: typography.title,
    lineHeight: lineHeights.title,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  input: {
    width: "100%",
    height: sizes.inputHeightLg,
    backgroundColor: colors.oceanDeep,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
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
  legal: {
    fontSize: typography.caption,
    lineHeight: lineHeights.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  legalLink: {
    textDecorationLine: "underline",
    color: colors.textPrimary,
  },
});
