import { useState, useRef, useCallback, useEffect } from "react";
import {
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
import {
  colors,
  spacing,
  typography,
  lineHeights,
  radius,
  sizes,
} from "../theme";

const STEPS = [
  { key: "height", title: "How tall are you?" },
  { key: "bio", title: "Write a short bio" },
  { key: "job", title: "What do you do for work?" },
  { key: "school", title: "Where did you study?" },
  { key: "religion", title: "What's your faith?" },
  { key: "politics", title: "What are your political views?" },
];

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
    const val = profile[STEPS[i].key];
    if (!val || !String(val).trim()) return i;
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

  const current = STEPS[step];
  const val = fields[current.key];
  const canContinue = !!val && val.trim().length > 0;

  const update = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleNext = () => {
    const key = current.key;
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

  const handleBack = () => {
    const key = current.key;
    const value = fields[key];
    if (value && String(value).trim()) {
      onSavePartial?.({ [key]: value });
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
      dismissKeyboard={current.key !== "height" && current.key !== "religion" && current.key !== "politics"}
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
