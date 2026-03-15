import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
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
import { colors, spacing, typography, lineHeights, radius, sizes } from "../theme";
import { sendEmailOtp, verifyEmailOtp } from "../lib/api";

export default function LoginScreen({ onLogin, onBack }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSend = email.trim().includes("@");
  const canVerify = code.trim().length >= 6;

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) return;
    setLoading(true);
    setError("");
    const result = await sendEmailOtp(trimmed);
    setLoading(false);
    if (result.success) {
      setStep("code");
    } else {
      setError(result.message || "Failed to send code");
    }
  };

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 6) return;
    setLoading(true);
    setError("");
    const result = await verifyEmailOtp(email.trim().toLowerCase(), trimmedCode);
    setLoading(false);
    if (result.success) {
      onLogin(email.trim().toLowerCase());
    } else {
      setError(result.message || "Invalid code");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />

        <SafeAreaView style={styles.safeTop}>
          <View style={styles.topBar}>
            <Pressable onPress={onBack}>
              <Text style={styles.backLink}>Back</Text>
            </Pressable>
            <View style={styles.topBarSpacer} />
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inner}
        >
          <View style={styles.formArea}>
            {step === "email" ? (
              <>
                <Text style={styles.prompt}>Welcome back</Text>
                <Text style={styles.subtitle}>
                  Enter the email linked to your account
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(""); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={handleSendCode}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    canSend && !loading ? styles.buttonActive : styles.buttonDisabled,
                    pressed && canSend && !loading && styles.buttonPressed,
                  ]}
                  onPress={handleSendCode}
                  disabled={!canSend || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.oceanAbyss} />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        canSend ? styles.buttonTextActive : styles.buttonTextDisabled,
                      ]}
                    >
                      Send Code
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.prompt}>Check your email</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to{"\n"}
                  {email.trim().toLowerCase()}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={(t) => { setCode(t); setError(""); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    canVerify && !loading ? styles.buttonActive : styles.buttonDisabled,
                    pressed && canVerify && !loading && styles.buttonPressed,
                  ]}
                  onPress={handleVerify}
                  disabled={!canVerify || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.oceanAbyss} />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        canVerify ? styles.buttonTextActive : styles.buttonTextDisabled,
                      ]}
                    >
                      Verify
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => { setStep("email"); setCode(""); setError(""); }}
                >
                  <Text style={styles.resendLink}>Use a different email</Text>
                </Pressable>
              </>
            )}
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
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  topBarSpacer: {
    flex: 1,
  },
  backLink: {
    fontSize: typography.body,
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  formArea: {
    alignItems: "center",
    gap: spacing.sm,
  },
  prompt: {
    fontSize: typography.title,
    lineHeight: lineHeights.title,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
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
  error: {
    fontSize: typography.bodySmall,
    color: "rgba(255,80,80,0.85)",
    textAlign: "center",
  },
  button: {
    width: "100%",
    height: sizes.buttonHeightLg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: {
    backgroundColor: colors.tealGlow,
  },
  buttonDisabled: {
    backgroundColor: colors.oceanDeep,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  buttonTextActive: {
    color: colors.oceanAbyss,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  resendLink: {
    fontSize: typography.bodySmall,
    color: colors.tealGlow,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
});
