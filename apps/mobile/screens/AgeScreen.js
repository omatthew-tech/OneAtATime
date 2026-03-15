import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import OnboardingLayout from "../components/OnboardingLayout";
import { colors, spacing, radius, sizes, typography } from "../theme";

export default function AgeScreen({ initialValue = "", onNext, onBack, onUpdate }) {
  const [age, setAge] = useState(initialValue ? String(initialValue) : "");

  const numericAge = parseInt(age, 10);
  const canContinue = !isNaN(numericAge) && numericAge >= 18 && numericAge <= 120;

  function handleChange(text) {
    const cleaned = text.replace(/[^0-9]/g, "");
    setAge(cleaned);
    onUpdate?.({ age: cleaned });
  }

  return (
    <OnboardingLayout
      step={3}
      totalSteps={5}
      title="What is your age?"
      canContinue={canContinue}
      onBack={onBack}
      onNext={() => onNext({ age: numericAge })}
      dismissKeyboard
    >
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor={colors.textMuted}
          value={age}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={3}
          returnKeyType="done"
          autoFocus
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    width: "100%",
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
});
