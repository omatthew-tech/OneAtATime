import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography, lineHeights, radius } from "../theme";

const ACTIONS = [
  { key: "we-met", label: "We Met" },
  { key: "pass", label: "Pass" },
  { key: "block", label: "Block", danger: true },
  { key: "report", label: "Report", danger: true },
];

export default function ActionSheet({ visible, onClose, onSelect }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {ACTIONS.map(({ key, label, danger }, i) => (
            <Pressable
              key={key}
              style={[styles.option, i < ACTIONS.length - 1 && styles.optionBorder]}
              onPress={() => {
                onSelect(key);
                onClose();
              }}
            >
              <Text style={[styles.optionText, danger && styles.dangerText]}>
                {label}
              </Text>
            </Pressable>
          ))}

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.oceanDeep,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  dangerText: {
    color: "rgba(255,80,80,0.85)",
  },
  cancelButton: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.oceanMid,
    alignItems: "center",
  },
  cancelText: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
