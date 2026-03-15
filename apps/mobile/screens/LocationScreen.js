import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";
import OnboardingLayout from "../components/OnboardingLayout";
import {
  colors,
  spacing,
  typography,
  radius,
  sizes,
} from "../theme";

let Location = null;
try {
  Location = require("expo-location");
} catch (e) {
  // expo-location unavailable (Expo Go or unlinked native module)
}

function GpsIcon({ size = 22, color = colors.tealGlow }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <SvgPath d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = colors.tealGlow }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <SvgPath d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export default function LocationScreen({ initialLocation, initialHidden, initialCountry, onNext, onBack }) {
  const [locationText, setLocationText] = useState(initialLocation || "");
  const [hideLocation, setHideLocation] = useState(!!initialHidden);
  const [country, setCountry] = useState(initialCountry || "");
  const [gettingLocation, setGettingLocation] = useState(false);

  const canContinue = locationText.trim().length > 0;

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
        setLocationText(parts.join(", ") || "");
        setCountry(geo.country || geo.isoCountryCode || "");
      }
    } catch (e) {
      console.warn("Location error:", e);
    }
    setGettingLocation(false);
  }, []);

  return (
    <OnboardingLayout
      step={5}
      totalSteps={5}
      title="What's your location?"
      canContinue={canContinue}
      onBack={onBack}
      onNext={() =>
        onNext({
          location_text: locationText.trim(),
          location_hidden: hideLocation,
          country: country,
        })
      }
      dismissKeyboard
    >
      <View style={styles.fieldWrap}>
        <View style={styles.locationRow}>
          <TextInput
            style={[styles.input, styles.locationInput]}
            placeholder="City, State"
            placeholderTextColor={colors.textMuted}
            value={locationText}
            onChangeText={setLocationText}
            autoFocus
            returnKeyType="done"
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
        <Text style={styles.fieldHint}>
          Or tap the icon to use your current location
        </Text>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setHideLocation((v) => !v)}
        >
          <View style={[styles.checkbox, hideLocation && styles.checkboxChecked]}>
            {hideLocation && <CheckIcon />}
          </View>
          <Text style={styles.checkboxLabel}>Don't show on profile</Text>
        </Pressable>
        <Text style={styles.checkboxHint}>
          Only your country will be visible to others
        </Text>
      </View>
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
  locationRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  locationInput: {
    flex: 1,
  },
  gpsButton: {
    width: sizes.inputHeightLg,
    height: sizes.inputHeightLg,
    backgroundColor: colors.oceanDeep,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  fieldHint: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.oceanDeep,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    borderColor: colors.tealGlow,
    backgroundColor: "rgba(0,212,170,0.15)",
  },
  checkboxLabel: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  checkboxHint: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
    paddingLeft: 44,
  },
});
