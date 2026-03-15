import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";
import OnboardingLayout from "../components/OnboardingLayout";
import { colors, spacing, typography, lineHeights, radius } from "../theme";
import { pickAndUploadPhoto, deletePhoto, fetchExistingPhotos } from "../lib/photos";

const TOTAL_SLOTS = 6;
const REQUIRED = 3;

function PlusIcon({ size = 28, color = colors.tealGlow }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <SvgPath d="M12 5v14M5 12h14" />
    </Svg>
  );
}

function CloseIcon({ size = 16, color = colors.textPrimary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <SvgPath d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export default function PhotosScreen({ profileId, onNext, onBack }) {
  const [photos, setPhotos] = useState(Array(TOTAL_SLOTS).fill(null));
  const [uploading, setUploading] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    if (!profileId) { setLoadingExisting(false); return; }
    fetchExistingPhotos(profileId, TOTAL_SLOTS).then((slots) => {
      setPhotos(slots);
      setLoadingExisting(false);
    });
  }, [profileId]);

  const filledCount = photos.filter(Boolean).length;
  const canContinue = filledCount >= REQUIRED;

  const handleAdd = async (index) => {
    if (!profileId || uploading !== null) return;
    setUploading(index);
    try {
      const url = await pickAndUploadPhoto(profileId, index);
      if (url) {
        setPhotos((prev) => {
          const next = [...prev];
          next[index] = url;
          return next;
        });
      }
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (index) => {
    if (!profileId || uploading !== null) return;
    setUploading(index);
    try {
      await deletePhoto(profileId, index);
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
    } finally {
      setUploading(null);
    }
  };

  return (
    <OnboardingLayout
      step={4}
      totalSteps={5}
      title="Add your photos"
      canContinue={canContinue}
      onBack={onBack}
      onNext={() => onNext({ photos: photos.filter(Boolean) })}
    >
      <Text style={styles.subtitle}>
        At least {REQUIRED} photos required. You can add up to {TOTAL_SLOTS}.
      </Text>

      <View style={styles.grid}>
        {photos.map((uri, i) => {
          const isRequired = i < REQUIRED;
          const isUploading = uploading === i;

          return (
            <View key={i} style={styles.slotWrap}>
              <Pressable
                style={[styles.slot, uri && styles.slotFilled]}
                onPress={() => (uri ? handleRemove(i) : handleAdd(i))}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={colors.tealGlow} />
                ) : uri ? (
                  <>
                    <Image source={{ uri }} style={styles.slotImage} />
                    <View style={styles.removeButton}>
                      <CloseIcon />
                    </View>
                  </>
                ) : (
                  <View style={styles.emptySlot}>
                    <PlusIcon />
                    {isRequired && !uri && (
                      <Text style={styles.requiredLabel}>Required</Text>
                    )}
                  </View>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={styles.hint}>
        Tip: profiles with more photos get more attention
      </Text>
    </OnboardingLayout>
  );
}

const SLOT_GAP = spacing.xs;
const SLOT_COLUMNS = 3;

const styles = StyleSheet.create({
  subtitle: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SLOT_GAP,
  },
  slotWrap: {
    width: `${(100 - ((SLOT_COLUMNS - 1) * SLOT_GAP) / 3) / SLOT_COLUMNS}%`,
    aspectRatio: 3 / 4,
    flexGrow: 1,
    flexBasis: "30%",
    maxWidth: "32%",
  },
  slot: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.oceanDeep,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  slotFilled: {
    borderWidth: 0,
    borderStyle: "solid",
  },
  slotImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeButton: {
    position: "absolute",
    top: spacing.xxs,
    right: spacing.xxs,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptySlot: {
    alignItems: "center",
    gap: spacing.xxs,
  },
  requiredLabel: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.tealGlow,
  },
  hint: {
    fontSize: typography.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    fontStyle: "italic",
  },
});
