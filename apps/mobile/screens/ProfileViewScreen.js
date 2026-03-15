import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";
import { colors, spacing, typography, lineHeights, radius, sizes } from "../theme";
import LiquidHeart from "../components/LiquidHeart";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.15;

const HEART_COUNT = 18;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function HeartParticle({ delay, startX, startY, size, drift, color, opacity: baseOpacity }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: randomBetween(1200, 2000),
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, startY - randomBetween(180, 400)],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [startX, startX + drift * 0.4, startX + drift, startX + drift * 0.7],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.2, 0.5, 1],
    outputRange: [0, 1.2, 1, 0.6],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 0.6, 1],
    outputRange: [0, baseOpacity, baseOpacity * 0.8, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        transform: [{ translateX }, { translateY }, { scale }],
        opacity,
      }}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
        <SvgPath d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </Svg>
    </Animated.View>
  );
}

function HeartBurstOverlay({ visible, onFinished }) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sentScale = useRef(new Animated.Value(0)).current;
  const sentOpacity = useRef(new Animated.Value(0)).current;

  const hearts = useMemo(() => {
    if (!visible) return [];
    const tealVariants = [colors.tealGlow, "#5CEAD4", "#38BDF8", "#A7F3D0", "#6EE7B7"];
    return Array.from({ length: HEART_COUNT }, (_, i) => ({
      id: i,
      delay: randomBetween(0, 600),
      startX: randomBetween(SCREEN_WIDTH * 0.1, SCREEN_WIDTH * 0.8),
      startY: randomBetween(SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT * 0.7),
      size: randomBetween(18, 42),
      drift: randomBetween(-80, 80),
      color: tealVariants[Math.floor(Math.random() * tealVariants.length)],
      opacity: randomBetween(0.5, 1),
    }));
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(sentScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(sentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 700);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(sentOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => onFinished?.());
    }, 2200);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.burstOverlay, { opacity: overlayOpacity }]} pointerEvents="none">
      {hearts.map((h) => (
        <HeartParticle key={h.id} {...h} />
      ))}
      <Animated.View
        style={[
          styles.sentBadge,
          { transform: [{ scale: sentScale }], opacity: sentOpacity },
        ]}
      >
        <Text style={styles.sentText}>Match sent</Text>
      </Animated.View>
    </Animated.View>
  );
}

function BackArrow({ size = 24, color = colors.textPrimary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <SvgPath d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight({ size = 20, color = colors.textPrimary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <SvgPath d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LocationPin({ size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.tealGlow} stroke="none">
      <SvgPath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </Svg>
  );
}

function DotIndicator({ count, activeIndex, maxAllowed }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => {
        const locked = i > maxAllowed;
        const active = i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              active && styles.dotActive,
              locked && styles.dotLocked,
            ]}
          />
        );
      })}
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function RedactedAnswer({ text, revealed }) {
  const scribbleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (revealed) {
      Animated.timing(scribbleOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [revealed]);

  return (
    <View>
      <Text style={styles.promptAnswer}>{text}</Text>
      <Animated.View
        style={[styles.redactOverlay, { opacity: scribbleOpacity }]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.scribble,
            { width: "94%", transform: [{ rotate: "-0.5deg" }] },
          ]}
        />
        <View
          style={[
            styles.scribble,
            {
              width: "80%",
              transform: [{ rotate: "0.8deg" }],
              marginTop: -4,
            },
          ]}
        />
        <View
          style={[
            styles.scribble,
            {
              width: "62%",
              transform: [{ rotate: "-0.3deg" }],
              marginTop: -4,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const PROFILE_FIELDS = [
  "location_text",
  "height",
  "bio",
  "job",
  "school",
  "religion",
  "politics",
];

function isProfileComplete(p) {
  if (!p) return false;
  return PROFILE_FIELDS.every((f) => p[f] && String(p[f]).trim().length > 0);
}

export default function ProfileViewScreen({ profile, myProfile, onBack, onMatch, onPass, onCompleteProfile, initialRevealStage = 0, totalRevealable = 2, onRevealChange }) {
  const [revealStage, setRevealStage] = useState(initialRevealStage);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [glowPhotoIndex, setGlowPhotoIndex] = useState(-1);
  const photosRef = useRef(null);
  const scrollRef = useRef(null);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const matchThreshold = Math.max(1, totalRevealable);
  const maxPhotoIndex = Math.min(revealStage, profile.photos.length - 1);
  const fillPercent = totalRevealable > 0
    ? 0.5 + (revealStage / matchThreshold) * 0.5
    : 1;
  const isMatched = revealStage >= matchThreshold;
  const promptsRevealed = isMatched;

  const hintOpacity = useRef(new Animated.Value(0)).current;
  const buttonBounce = useRef(new Animated.Value(1)).current;

  const triggerHint = useCallback(() => {
    Animated.sequence([
      Animated.timing(hintOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(1400),
      Animated.timing(hintOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(buttonBounce, {
        toValue: 1.1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(buttonBounce, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(buttonBounce, {
        toValue: 1.06,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(buttonBounce, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hintOpacity, buttonBounce]);

  const handleReveal = () => {
    if (!isProfileComplete(myProfile)) {
      setShowIncomplete(true);
      return;
    }

    if (isMatched) {
      setShowBurst(true);
      return;
    }

    const next = revealStage + 1;
    setRevealStage(next);
    onRevealChange?.(next);

    const newMaxPhoto = Math.min(next, profile.photos.length - 1);
    const prevMaxPhoto = Math.min(revealStage, profile.photos.length - 1);

    if (newMaxPhoto > prevMaxPhoto && profile.photos[newMaxPhoto]) {
      setGlowPhotoIndex(newMaxPhoto);
      photosRef.current?.scrollToIndex({ index: newMaxPhoto, animated: true });

      glowAnim.setValue(0);
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 300, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.8, duration: 300, useNativeDriver: false }),
        Animated.delay(600),
        Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]).start(() => setGlowPhotoIndex(-1));
    }
  };

  const handleBurstFinished = useCallback(() => {
    setShowBurst(false);
    onMatch?.(profile);
  }, [onMatch, profile]);

  const onPhotoScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);

    if (index > maxPhotoIndex) {
      photosRef.current?.scrollToIndex({
        index: maxPhotoIndex,
        animated: true,
      });
      triggerHint();
      return;
    }

    setActivePhotoIndex(index);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoSection}>
          <FlatList
            ref={photosRef}
            horizontal
            pagingEnabled
            data={profile.photos}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <View style={styles.photoFrame}>
                <Image source={{ uri: item }} style={styles.photo} />
                {index > maxPhotoIndex && (
                  <View style={styles.photoBlur} />
                )}
                {index === glowPhotoIndex && (
                  <Animated.View
                    style={[
                      styles.photoGlow,
                      {
                        borderColor: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["rgba(0,212,170,0)", colors.tealGlow],
                        }),
                        shadowOpacity: glowAnim,
                      },
                    ]}
                    pointerEvents="none"
                  />
                )}
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPhotoScrollEnd}
          />

          <Animated.View
            style={[styles.hintOverlay, { opacity: hintOpacity }]}
            pointerEvents="none"
          >
            <View style={styles.hintBadge}>
              <Text style={styles.hintText}>Tap Reveal to unlock</Text>
            </View>
          </Animated.View>

          <Pressable style={styles.backButton} onPress={onBack}>
            <BackArrow />
          </Pressable>

          <View style={styles.dotsContainer}>
            <DotIndicator
              count={profile.photos.length}
              activeIndex={activePhotoIndex}
              maxAllowed={maxPhotoIndex}
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.locationRow}>
            <LocationPin />
            <Text style={styles.location}>{profile.location}</Text>
          </View>

          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}

          <View style={styles.buttonRow}>
            <Animated.View
              style={[styles.revealWrap, { transform: [{ scale: buttonBounce }] }]}
            >
              <Pressable
                style={[
                  styles.revealButton,
                  isMatched && styles.matchButton,
                ]}
                onPress={handleReveal}
              >
                <LiquidHeart
                  size={28}
                  fillPercent={fillPercent}
                  liquidColor={isMatched ? colors.textPrimary : colors.tealGlow}
                  outlineColor={isMatched ? colors.textPrimary : colors.tealGlow}
                />
                <Text
                  style={[
                    styles.revealText,
                    isMatched && styles.matchText,
                  ]}
                >
                  {isMatched ? "Match" : "Reveal"}
                </Text>
                {isMatched && (
                  <ChevronRight size={18} color={colors.textPrimary} />
                )}
              </Pressable>
            </Animated.View>

            <Pressable style={styles.passButton} onPress={() => onPass?.(profile) ?? onBack?.()}>
              <Text style={styles.passText}>Pass</Text>
            </Pressable>
          </View>

          {profile.prompts?.length > 0 && (
            <View style={styles.promptsSection}>
              {profile.prompts.map((p, i) => (
                <View key={i} style={styles.promptCard}>
                  <Text style={styles.promptLabel}>{p.prompt_text}</Text>
                  <RedactedAnswer
                    text={p.answer}
                    revealed={promptsRevealed}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={styles.detailsSection}>
            <DetailRow label="Age" value={String(profile.age)} />
            <DetailRow label="Gender" value={profile.gender} />
            <DetailRow label="Vibe" value={profile.introversion} />
          </View>
        </View>
      </ScrollView>
      <HeartBurstOverlay visible={showBurst} onFinished={handleBurstFinished} />

      <Modal
        visible={showIncomplete}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIncomplete(false)}
      >
        <Pressable
          style={styles.incompleteOverlay}
          onPress={() => setShowIncomplete(false)}
        >
          <Pressable
            style={styles.incompleteModal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.incompleteTitle}>Complete Your Profile</Text>
            <Text style={styles.incompleteBody}>
              Please finish filling out your profile before you can reveal or
              match with someone. It only takes a minute!
            </Text>
            <View style={styles.incompleteButtons}>
              <Pressable
                style={styles.incompleteLater}
                onPress={() => setShowIncomplete(false)}
              >
                <Text style={styles.incompleteLaterText}>Later</Text>
              </Pressable>
              <Pressable
                style={styles.incompleteGo}
                onPress={() => {
                  setShowIncomplete(false);
                  onCompleteProfile?.();
                }}
              >
                <Text style={styles.incompleteGoText}>Let's Go</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.oceanAbyss,
  },
  scroll: {
    flex: 1,
  },

  photoSection: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photoFrame: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photoBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 22, 40, 0.85)",
  },
  photoGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    shadowColor: colors.tealGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    resizeMode: "cover",
  },
  backButton: {
    position: "absolute",
    top: spacing.xxxl,
    left: spacing.sm,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  hintOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  hintBadge: {
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.tealGlow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  hintText: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.tealGlow,
  },
  dotsContainer: {
    position: "absolute",
    bottom: spacing.sm,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: colors.textPrimary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotLocked: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  infoSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.hero,
  },
  name: {
    fontSize: typography.h1,
    lineHeight: lineHeights.h1,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  location: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
  },
  bio: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  buttonRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  passButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.oceanDeep,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passText: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.textMuted,
  },
  revealWrap: {
    flex: 2,
  },
  revealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.oceanDeep,
    borderWidth: 1.5,
    borderColor: colors.tealGlow,
  },
  matchButton: {
    backgroundColor: colors.tealGlow,
    borderColor: colors.tealGlow,
  },
  revealText: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.tealGlow,
  },
  matchText: {
    color: colors.oceanAbyss,
  },

  promptsSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  promptCard: {
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  promptLabel: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  promptAnswer: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
  },
  redactOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  scribble: {
    height: 16,
    borderRadius: 7,
    backgroundColor: colors.oceanMid,
    marginVertical: 1,
  },

  detailsSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  detailValue: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  burstOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 11, 23, 0.55)",
    zIndex: 100,
  },
  sentBadge: {
    position: "absolute",
    alignSelf: "center",
    top: SCREEN_HEIGHT * 0.42,
    backgroundColor: colors.tealGlow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  sentText: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.oceanAbyss,
    letterSpacing: 0.5,
  },

  incompleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  incompleteModal: {
    width: "100%",
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  incompleteTitle: {
    fontSize: typography.title,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  incompleteBody: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  incompleteButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  incompleteLater: {
    flex: 1,
    height: sizes.buttonHeightMd,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.oceanMid,
  },
  incompleteLaterText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  incompleteGo: {
    flex: 2,
    height: sizes.buttonHeightMd,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.tealGlow,
  },
  incompleteGoText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.oceanAbyss,
  },
});
