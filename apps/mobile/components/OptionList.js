import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, typography, lineHeights } from "../theme";

export default function OptionList({ options, selected, onSelect }) {
  return (
    <View style={styles.list}>
      {options.map((option, index) => {
        const isSelected = selected === option;
        return (
          <View key={option}>
            <Pressable
              style={styles.row}
              onPress={() => onSelect(option)}
            >
              <Text style={styles.label}>{option}</Text>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
            {index < options.length - 1 && <View style={styles.divider} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.tealGlow,
    backgroundColor: colors.tealGlow,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.oceanAbyss,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
