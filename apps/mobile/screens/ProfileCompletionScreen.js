import { useState, useRef, useCallback, useEffect } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path as SvgPath } from "react-native-svg";
import OnboardingLayout from "../components/OnboardingLayout";
import OptionList from "../components/OptionList";
import { upsertPrompt } from "../lib/api";
import {
  colors,
  spacing,
  typography,
  lineHeights,
  radius,
  sizes,
} from "../theme";

const ALL_PROMPTS = [
  "Typical Sunday",
  "To me, relaxation is",
  "I wind down by",
  "My simple pleasures",
  "I geek out on",
  "The one thing you should know about me is",
  "A boundary of mine is",
  "Something that's non-negotiable for me is",
  "I feel most supported when",
  "The hallmark of a good relationship is",
  "Together, we could",
  "The best way to ask me out is by",
];

const STEPS = [
  { key: "height", title: "How tall are you?" },
  { key: "bio", title: "Write a short bio" },
  { key: "job", title: "What do you do for work?" },
  { key: "school", title: "Where did you study?" },
  { key: "religion", title: "What's your faith?" },
  { key: "politics", title: "What are your political views?" },
  { key: "prompts", title: "Add your prompts" },
];

const PROMPT_SLOTS = 3;

const RELIGION_OPTIONS = [
  "Christian",
  "Catholic",
  "Jewish",
  "Muslim",
  "Hindu",
  "Buddhist",
  "Agnostic",
  "Atheist",
  "Spiritual",
  "Other",
  "Prefer not to say",
];

const POLITICS_OPTIONS = [
  "Liberal",
  "Moderate",
  "Conservative",
  "Not political",
  "Prefer not to say",
];

const HEIGHTS = [];
for (let feet = 4; feet <= 7; feet++) {
  const max = feet === 7 ? 0 : 11;
  for (let inches = 0; inches <= max; inches++) {
    HEIGHTS.push(`${feet}\u2032${inches}\u2033`);
  }
}
const DEFAULT_HEIGHT_IDX = HEIGHTS.indexOf("5\u203210\u2033");

const ITEM_H = 52;
const VISIBLE_ITEMS = 5;
const PICKER_H = ITEM_H * VISIBLE_ITEMS;

const FISH_MIN = 40;
const FISH_MAX = 120;

function HeightFish({ heightIndex, totalHeights }) {
  const t = totalHeights > 1 ? heightIndex / (totalHeights - 1) : 0.5;
  const fishSize = FISH_MIN + t * (FISH_MAX - FISH_MIN);
  const fishH = fishSize / 2;

  return (
    <View style={hStyles.fishWrap}>
      <Svg
        width={fishSize}
        height={fishH}
        viewBox="0 0 100 50"
        fill="none"
        stroke={colors.tealGlow}
        strokeWidth={2}
      >
        <SvgPath
          d="M 10 25 Q 30 5, 70 25 Q 30 45, 10 25 M 75 25 L 95 15 M 75 25 L 95 35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="25" cy="22" r="4" strokeWidth="2" />
      </Svg>
    </View>
  );
}

function HeightPicker({ value, onChange }) {
  const scrollRef = useRef(null);
  const initialIdx = HEIGHTS.indexOf(value);
  const [centerIdx, setCenterIdx] = useState(
    initialIdx >= 0 ? initialIdx : DEFAULT_HEIGHT_IDX
  );
  const mountedRef = useRef(false);

  useEffect(() => {
    const idx = initialIdx >= 0 ? initialIdx : DEFAULT_HEIGHT_IDX;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: false });
      mountedRef.current = true;
    }, 80);
  }, []);

  const handleScroll = useCallback((e) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_H);
    setCenterIdx(Math.max(0, Math.min(HEIGHTS.length - 1, idx)));
  }, []);

  const handleScrollEnd = useCallback(
    (e) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.max(0, Math.min(HEIGHTS.length - 1, Math.round(y / ITEM_H)));
      setCenterIdx(idx);
      onChange(HEIGHTS[idx]);
      scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: true });
    },
    [onChange]
  );

  return (
    <View style={hStyles.wrapper}>
      <View style={hStyles.container}>
        <View style={[hStyles.divider, { top: ITEM_H * 2 }]} pointerEvents="none" />
        <View style={[hStyles.divider, { top: ITEM_H * 3 }]} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          style={hStyles.scroll}
          contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
        >
          {HEIGHTS.map((h, i) => {
            const d = Math.abs(i - centerIdx);
            return (
              <View key={h} style={hStyles.item}>
                <Text
                  style={[
                    hStyles.itemText,
                    d === 0 && hStyles.selected,
                    d === 1 && hStyles.near,
                    d >= 2 && hStyles.far,
                  ]}
                >
                  {h}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
      <HeightFish heightIndex={centerIdx} totalHeights={HEIGHTS.length} />
    </View>
  );
}

const hStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  fishWrap: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  container: {
    height: PICKER_H,
    width: "80%",
    position: "relative",
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
  },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.textSecondary,
    zIndex: 10,
  },
  item: {
    height: ITEM_H,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    fontSize: typography.body,
    color: colors.textMuted,
    fontWeight: "500",
  },
  selected: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  near: {
    fontSize: typography.subtitle,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  far: {
    fontSize: typography.body,
    color: colors.textMuted,
    opacity: 0.4,
  },
});

function getFirstIncompleteStep(profile) {
  for (let i = 0; i < STEPS.length; i++) {
    const key = STEPS[i].key;
    if (key === "prompts") {
      const filled = (profile.prompts || []).filter((p) => p.answer && p.answer.trim());
      if (filled.length === 0) return i;
    } else {
      const val = profile[key];
      if (!val || !String(val).trim()) return i;
    }
  }
  return STEPS.length - 1;
}

export default function ProfileCompletionScreen({ profile, onComplete, onCancel, onSavePartial }) {
  const [step, setStep] = useState(() => getFirstIncompleteStep(profile));
  const [fields, setFields] = useState({
    height: profile.height || "",
    bio: profile.bio || "",
    job: profile.job || "",
    school: profile.school || "",
    religion: profile.religion || "",
    politics: profile.politics || "",
  });

  const existingPrompts = profile.prompts || [];
  const [prompts, setPrompts] = useState(() => {
    const slots = [];
    for (let i = 0; i < PROMPT_SLOTS; i++) {
      const existing = existingPrompts[i];
      slots.push({
        prompt_text: existing?.prompt_text || "",
        answer: existing?.answer || "",
      });
    }
    return slots;
  });
  const [editingSlot, setEditingSlot] = useState(-1);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [editAnswer, setEditAnswer] = useState("");

  const current = STEPS[step];

  const canContinue = (() => {
    if (current.key === "prompts") {
      return prompts.some((p) => p.prompt_text && p.answer.trim());
    }
    const val = fields[current.key];
    return !!val && val.trim().length > 0;
  })();

  const update = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buildPromptsList = useCallback(() => {
    return prompts
      .filter((p) => p.prompt_text && p.answer.trim())
      .map((p, i) => ({
        prompt_text: p.prompt_text,
        answer: p.answer.trim(),
        display_order: i,
      }));
  }, [prompts]);

  const savePrompts = useCallback(async () => {
    for (let i = 0; i < PROMPT_SLOTS; i++) {
      const p = prompts[i];
      if (p.prompt_text && p.answer.trim()) {
        await upsertPrompt(profile.id, p.prompt_text, p.answer.trim(), i);
      }
    }
  }, [prompts, profile.id]);

  const handleNext = async () => {
    const key = current.key;

    if (key === "prompts") {
      await savePrompts();
      onComplete({ ...fields, prompts: buildPromptsList() });
      return;
    }

    const value = fields[key];
    if (value && String(value).trim()) {
      onSavePartial?.({ [key]: value });
    }

    if (step === STEPS.length - 1) {
      onComplete(fields);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = async () => {
    const key = current.key;

    if (key === "prompts") {
      await savePrompts();
      onSavePartial?.({ prompts: buildPromptsList() });
    } else {
      const value = fields[key];
      if (value && String(value).trim()) {
        onSavePartial?.({ [key]: value });
      }
    }

    if (step === 0) {
      onCancel();
    } else {
      setStep((s) => s - 1);
    }
  };

  const renderContent = () => {
    switch (current.key) {
      case "height":
        return (
          <HeightPicker
            value={fields.height}
            onChange={(h) => update("height", h)}
          />
        );

      case "bio":
        return (
          <View style={styles.fieldWrap}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell others a little about yourself..."
              placeholderTextColor={colors.textMuted}
              value={fields.bio}
              onChangeText={(t) => update("bio", t)}
              multiline
              maxLength={300}
              textAlignVertical="top"
              autoFocus
            />
            <Text style={styles.charCount}>
              {fields.bio.length}/300
            </Text>
          </View>
        );

      case "religion":
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <OptionList
              options={RELIGION_OPTIONS}
              selected={fields.religion}
              onSelect={(v) => update("religion", v)}
            />
          </ScrollView>
        );

      case "politics":
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <OptionList
              options={POLITICS_OPTIONS}
              selected={fields.politics}
              onSelect={(v) => update("politics", v)}
            />
          </ScrollView>
        );

      case "prompts": {
        const usedPrompts = prompts.map((p) => p.prompt_text).filter(Boolean);
        const available = ALL_PROMPTS.filter((p) => !usedPrompts.includes(p));

        return (
          <View style={pStyles.wrap}>
            <Text style={pStyles.hint}>Add at least 1 prompt (up to 3)</Text>
            {prompts.map((slot, i) => (
              <View key={i} style={pStyles.card}>
                {slot.prompt_text ? (
                  <View>
                    <View style={pStyles.promptHeader}>
                      <Text style={pStyles.promptText}>{slot.prompt_text}</Text>
                      <Pressable
                        onPress={() => {
                          setEditingSlot(i);
                          setShowPromptPicker(true);
                        }}
                      >
                        <Text style={pStyles.changeLink}>Change</Text>
                      </Pressable>
                    </View>
                    <TextInput
                      style={pStyles.answerInput}
                      placeholder="Your answer..."
                      placeholderTextColor={colors.textMuted}
                      value={slot.answer}
                      onChangeText={(t) =>
                        setPrompts((prev) =>
                          prev.map((p, j) => (j === i ? { ...p, answer: t } : p))
                        )
                      }
                      multiline
                      blurOnSubmit
                      returnKeyType="done"
                      maxLength={200}
                    />
                  </View>
                ) : (
                  <Pressable
                    style={pStyles.addButton}
                    onPress={() => {
                      setEditingSlot(i);
                      setShowPromptPicker(true);
                    }}
                  >
                    <Text style={pStyles.addPlus}>+</Text>
                    <Text style={pStyles.addLabel}>Add a prompt</Text>
                  </Pressable>
                )}
              </View>
            ))}

            <Modal
              visible={showPromptPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowPromptPicker(false)}
            >
              <View style={pStyles.pickerOverlay}>
                <View style={pStyles.pickerSheet}>
                  <View style={pStyles.pickerHeader}>
                    <Text style={pStyles.pickerTitle}>Select a prompt</Text>
                    <Pressable onPress={() => setShowPromptPicker(false)}>
                      <Text style={pStyles.pickerClose}>Cancel</Text>
                    </Pressable>
                  </View>
                  <FlatList
                    data={available}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <Pressable
                        style={pStyles.pickerItem}
                        onPress={() => {
                          setPrompts((prev) =>
                            prev.map((p, j) =>
                              j === editingSlot
                                ? { prompt_text: item, answer: "" }
                                : p
                            )
                          );
                          setShowPromptPicker(false);
                        }}
                      >
                        <Text style={pStyles.pickerItemText}>{item}</Text>
                      </Pressable>
                    )}
                  />
                </View>
              </View>
            </Modal>
          </View>
        );
      }

      default: {
        const placeholders = {
          job: "e.g., Software Engineer",
          school: "e.g., University of Michigan",
        };
        return (
          <View style={styles.fieldWrap}>
            <TextInput
              style={styles.input}
              placeholder={placeholders[current.key] || ""}
              placeholderTextColor={colors.textMuted}
              value={fields[current.key]}
              onChangeText={(t) => update(current.key, t)}
              autoFocus
              returnKeyType="done"
            />
          </View>
        );
      }
    }
  };

  return (
    <OnboardingLayout
      step={step + 1}
      totalSteps={STEPS.length}
      title={current.title}
      canContinue={canContinue}
      onBack={handleBack}
      onNext={handleNext}
      dismissKeyboard={current.key !== "height" && current.key !== "religion" && current.key !== "politics" && current.key !== "prompts"}
    >
      {renderContent()}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
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
  textArea: {
    height: 140,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  charCount: {
    fontSize: typography.caption,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: spacing.xxs,
  },
});

const pStyles = StyleSheet.create({
  wrap: {
    width: "100%",
    gap: spacing.sm,
  },
  hint: {
    fontSize: typography.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xxs,
  },
  card: {
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  promptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  promptText: {
    fontSize: typography.bodySmall,
    fontWeight: "600",
    color: colors.tealGlow,
    flex: 1,
  },
  changeLink: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  answerInput: {
    fontSize: typography.body,
    color: colors.textPrimary,
    lineHeight: lineHeights.body,
    minHeight: 40,
    padding: 0,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  addPlus: {
    fontSize: typography.title,
    fontWeight: "300",
    color: colors.tealGlow,
  },
  addLabel: {
    fontSize: typography.body,
    color: colors.textMuted,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: colors.oceanDeep,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "70%",
    paddingBottom: spacing.xl,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  pickerClose: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textMuted,
  },
  pickerItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontSize: typography.body,
    color: colors.textPrimary,
  },
});
