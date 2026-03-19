import { useRef, useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";
import { colors, spacing, typography, radius, sizes } from "../theme";
import { normalizeCountry } from "../lib/api";

let Location = null;
try {
  Location = require("expo-location");
} catch (e) {
  // expo-location unavailable
}

function CloseIcon({ size = 24, color = colors.textPrimary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <SvgPath d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LocationPin({ size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.tealGlow} stroke="none">
      <SvgPath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = colors.oceanAbyss }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3}>
      <SvgPath d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GpsIcon({ size = 22, color = colors.tealGlow }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <SvgPath d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </Svg>
  );
}

function HideCheckIcon({ size = 18, color = colors.tealGlow }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <SvgPath d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

function Checkbox({ label, checked, onToggle }) {
  return (
    <Pressable style={styles.checkboxRow} onPress={onToggle}>
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked && <CheckIcon />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

const THUMB_SIZE = 24;

function posToValue(pageX, trackX, trackWidth, min, max, step) {
  const pct = Math.max(0, Math.min(1, (pageX - trackX) / trackWidth));
  const raw = min + pct * (max - min);
  return Math.round(raw / step) * step;
}

function RangeSlider({ min, max, low, high, onLowChange, onHighChange, step = 1, onDragStart, onDragEnd }) {
  const trackRef = useRef(null);
  const trackLayout = useRef({ x: 0, width: 1 });
  const dragging = useRef(null);

  const range = max - min;
  const lowPct = ((low - min) / range) * 100;
  const highPct = ((high - min) / range) * 100;

  const onLayout = () => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackLayout.current = { x, width };
    });
  };

  const onStartDrag = (which) => (e) => {
    dragging.current = which;
    onDragStart?.();
    handleMove(e);
  };

  const onEndDrag = () => {
    dragging.current = null;
    onDragEnd?.();
  };

  const handleMove = (e) => {
    const { pageX } = e.nativeEvent;
    const { x, width } = trackLayout.current;
    const val = posToValue(pageX, x, width, min, max, step);

    if (dragging.current === "low") {
      onLowChange(Math.min(val, high - step));
    } else {
      onHighChange(Math.max(val, low + step));
    }
  };

  return (
    <View>
      <Text style={styles.rangeValue}>
        between <Text style={styles.rangeHighlight}>{low}</Text> and{" "}
        <Text style={styles.rangeHighlight}>
          {high >= max ? `${max}+` : high}
        </Text>
      </Text>
      <View
        ref={trackRef}
        style={styles.sliderTrackHit}
        onLayout={onLayout}
      >
        <View style={styles.sliderTrackInner}>
          <View
            style={[
              styles.sliderFill,
              { left: `${lowPct}%`, right: `${100 - highPct}%` },
            ]}
          />
        </View>
        <View
          style={[styles.sliderThumbHit, { left: `${lowPct}%` }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={onStartDrag("low")}
          onResponderMove={handleMove}
          onResponderRelease={onEndDrag}
          onResponderTerminate={onEndDrag}
        >
          <View style={styles.sliderThumb} />
        </View>
        <View
          style={[styles.sliderThumbHit, { left: `${highPct}%` }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={onStartDrag("high")}
          onResponderMove={handleMove}
          onResponderRelease={onEndDrag}
          onResponderTerminate={onEndDrag}
        >
          <View style={styles.sliderThumb} />
        </View>
      </View>
    </View>
  );
}

function SingleSlider({ value, min, max, onChange, step = 1, formatLabel, onDragStart, onDragEnd }) {
  const trackRef = useRef(null);
  const trackLayout = useRef({ x: 0, width: 1 });

  const pct = ((value - min) / (max - min)) * 100;

  const onLayout = () => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackLayout.current = { x, width };
    });
  };

  const handleGrant = (e) => {
    onDragStart?.();
    handleMove(e);
  };

  const handleEnd = () => {
    onDragEnd?.();
  };

  const handleMove = (e) => {
    const { pageX } = e.nativeEvent;
    const { x, width } = trackLayout.current;
    onChange(posToValue(pageX, x, width, min, max, step));
  };

  return (
    <View>
      <Text style={styles.distanceValue}>
        {formatLabel ? formatLabel(value) : value}
      </Text>
      <View
        ref={trackRef}
        style={styles.sliderTrackHit}
        onLayout={onLayout}
      >
        <View style={styles.sliderTrackInner}>
          <View
            style={[styles.sliderFill, { left: 0, right: `${100 - pct}%` }]}
          />
        </View>
        <View
          style={[styles.sliderThumbHit, { left: `${pct}%` }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={handleGrant}
          onResponderMove={handleMove}
          onResponderRelease={handleEnd}
          onResponderTerminate={handleEnd}
        >
          <View style={styles.sliderThumb} />
        </View>
      </View>
    </View>
  );
}

const DEFAULT_PREFS = {
  location: "",
  ageMin: 18,
  ageMax: 99,
  distance: 50,
  interestedIn: { Man: true, Woman: true, Nonbinary: true },
};

export default function PreferencesScreen({ preferences, locationHidden, onSave, onLocationHiddenChange, onClose }) {
  const [prefs, setPrefs] = useState(() => ({
    ...DEFAULT_PREFS,
    ...preferences,
    interestedIn: {
      ...DEFAULT_PREFS.interestedIn,
      ...(preferences?.interestedIn || {}),
    },
  }));
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [hideLocation, setHideLocation] = useState(!!locationHidden);
  const [gettingLocation, setGettingLocation] = useState(false);

  const lockScroll = () => setScrollEnabled(false);
  const unlockScroll = () => setScrollEnabled(true);

  const toggleInterest = (key) => {
    setPrefs((p) => ({
      ...p,
      interestedIn: { ...p.interestedIn, [key]: !p.interestedIn[key] },
    }));
  };

  const handleGps = useCallback(async () => {
    if (!Location) {
      console.warn("expo-location is not available");
      return;
    }
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGettingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        const parts = [geo.city, geo.region].filter(Boolean);
        const country = normalizeCountry(geo.isoCountryCode || geo.country || "");
        setPrefs((p) => ({ ...p, location: parts.join(", ") || "", country }));
      }
    } catch (e) {
      console.warn("Location error:", e);
    }
    setGettingLocation(false);
  }, []);

  const handleToggleHide = () => {
    const next = !hideLocation;
    setHideLocation(next);
    onLocationHiddenChange?.(next);
  };

  const handleSave = () => {
    onSave(prefs);
    onClose();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <CloseIcon />
          </Pressable>
          <Text style={styles.headerTitle}>Filters</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your location</Text>
            <View style={styles.locationCard}>
              <LocationPin />
              <TextInput
                style={styles.locationInput}
                value={prefs.location}
                onChangeText={(t) => setPrefs((p) => ({ ...p, location: t }))}
                placeholder="Enter your city"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable
                style={styles.gpsButton}
                onPress={handleGps}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <ActivityIndicator size="small" color={colors.tealGlow} />
                ) : (
                  <GpsIcon />
                )}
              </Pressable>
            </View>
            <Pressable style={styles.hideLocationRow} onPress={handleToggleHide}>
              <View style={[styles.hideCheckbox, hideLocation && styles.hideCheckboxChecked]}>
                {hideLocation && <HideCheckIcon />}
              </View>
              <View>
                <Text style={styles.hideLabel}>Don't show on profile</Text>
                <Text style={styles.hideHint}>Only your country will be visible to others</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How old are they?</Text>
            <RangeSlider
              min={18}
              max={99}
              low={prefs.ageMin}
              high={prefs.ageMax}
              onLowChange={(v) => setPrefs((p) => ({ ...p, ageMin: v }))}
              onHighChange={(v) => setPrefs((p) => ({ ...p, ageMax: v }))}
              onDragStart={lockScroll}
              onDragEnd={unlockScroll}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How far away are they?</Text>
            <SingleSlider
              value={prefs.distance}
              min={1}
              max={50}
              step={1}
              onChange={(v) => setPrefs((p) => ({ ...p, distance: v }))}
              formatLabel={(v) => (v >= 50 ? "Wherever" : `${v} mi`)}
              onDragStart={lockScroll}
              onDragEnd={unlockScroll}
            />
            <View style={styles.distanceLabels}>
              <Text style={styles.distanceLabel}>1 mi</Text>
              <Text style={styles.distanceLabel}>50+ mi</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>I'm interested in</Text>
            <View style={styles.checkboxGroup}>
              <Checkbox
                label="Men"
                checked={prefs.interestedIn.Man}
                onToggle={() => toggleInterest("Man")}
              />
              <Checkbox
                label="Women"
                checked={prefs.interestedIn.Woman}
                onToggle={() => toggleInterest("Woman")}
              />
              <Checkbox
                label="Nonbinary"
                checked={prefs.interestedIn.Nonbinary}
                onToggle={() => toggleInterest("Nonbinary")}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.oceanAbyss,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },

  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: sizes.inputHeightLg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationInput: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  gpsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  hideLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  hideCheckbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.oceanDeep,
    justifyContent: "center",
    alignItems: "center",
  },
  hideCheckboxChecked: {
    borderColor: colors.tealGlow,
    backgroundColor: "rgba(0,212,170,0.15)",
  },
  hideLabel: {
    fontSize: typography.bodySmall,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  hideHint: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  rangeValue: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  rangeHighlight: {
    fontWeight: "700",
    color: colors.textPrimary,
  },

  sliderTrackHit: {
    height: 48,
    justifyContent: "center",
    position: "relative",
    marginBottom: spacing.xs,
  },
  sliderTrackInner: {
    height: 4,
    backgroundColor: colors.oceanMid,
    borderRadius: 2,
    position: "relative",
  },
  sliderFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: colors.tealGlow,
    borderRadius: 2,
  },
  sliderThumbHit: {
    position: "absolute",
    width: 48,
    height: 48,
    marginLeft: -24,
    justifyContent: "center",
    alignItems: "center",
  },
  sliderThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.textPrimary,
  },

  distanceValue: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  distanceLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  distanceLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },

  checkboxGroup: {
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkboxBox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBoxChecked: {
    backgroundColor: colors.tealGlow,
    borderColor: colors.tealGlow,
  },
  checkboxLabel: {
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: colors.tealGlow,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxxl,
  },
  saveText: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.oceanAbyss,
  },
});
