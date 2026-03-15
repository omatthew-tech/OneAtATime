import { useState, useMemo, useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";
import { colors, spacing, typography, lineHeights, radius } from "../theme";
import { fetchDiscoverFeed } from "../lib/api";
import FishIcon from "../components/FishIcon";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CARD_HORIZONTAL_MARGIN = spacing.sm;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const CARD_VERTICAL_GAP = spacing.xs;
const TOP_CHROME = 120;
const BOTTOM_NAV = 80;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - TOP_CHROME - BOTTOM_NAV;
const PEEK = spacing.xl;
const CARD_HEIGHT = AVAILABLE_HEIGHT - PEEK * 2;

function FilterIcon({ size = 22, color = colors.textSecondary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <SvgPath d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LocationPin({ size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.tealGlow} stroke="none">
      <SvgPath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </Svg>
  );
}

function ProfileCard({ item, onPress }) {
  const photoUri = item.photos?.[0];
  return (
    <Pressable style={styles.card} onPress={() => onPress(item)}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: colors.oceanDeep }]} />
      )}
      <View style={styles.cardOverlay}>
        <Text style={styles.cardName}>{item.name}</Text>
        <View style={styles.cardLocationRow}>
          <LocationPin size={14} />
          <Text style={styles.cardLocation}>{item.location || item.location_text || ""}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen({ profileId, myCountry, preferences, onViewProfile, onOpenPrefs }) {
  const [tab, setTab] = useState("local");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const data = await fetchDiscoverFeed(profileId, preferences || {}, tab, myCountry);
    setProfiles(data);
    setLoading(false);
  }, [profileId, preferences, tab, myCountry]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const snapOffsets = useMemo(
    () =>
      profiles.map((_, i) =>
        i === 0 ? 0 : i * (CARD_HEIGHT + CARD_VERTICAL_GAP) - PEEK
      ),
    [profiles]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleTab, tab === "local" && styles.toggleTabActive]}
              onPress={() => setTab("local")}
            >
              <Text style={[styles.toggleText, tab === "local" && styles.toggleTextActive]}>
                Local
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleTab, tab === "international" && styles.toggleTabActive]}
              onPress={() => setTab("international")}
            >
              <Text style={[styles.toggleText, tab === "international" && styles.toggleTextActive]}>
                International
              </Text>
            </Pressable>
          </View>
          <Pressable style={styles.filterButton} onPress={onOpenPrefs}>
            <View style={{ transform: [{ rotate: "90deg" }] }}>
              <FilterIcon />
            </View>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.tealGlow} />
          </View>
        ) : profiles.length === 0 ? (
          <View style={styles.centered}>
            <FishIcon size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No one nearby yet</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon or adjust your filters
            </Text>
          </View>
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProfileCard item={item} onPress={onViewProfile} />
            )}
            contentContainerStyle={styles.feed}
            showsVerticalScrollIndicator={false}
            snapToOffsets={snapOffsets}
            decelerationRate="fast"
          />
        )}
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

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: CARD_HORIZONTAL_MARGIN,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.oceanDeep,
    justifyContent: "center",
    alignItems: "center",
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.pill,
    padding: spacing.xxs,
    alignSelf: "flex-start",
  },
  toggleTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  toggleTabActive: {
    backgroundColor: colors.oceanMid,
  },
  toggleText: {
    fontSize: typography.bodySmall,
    fontWeight: "600",
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.title,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
    textAlign: "center",
  },

  feed: {
    paddingHorizontal: CARD_HORIZONTAL_MARGIN,
    gap: CARD_VERTICAL_GAP,
    paddingBottom: PEEK,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.oceanDeep,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xxxl,
    backgroundColor: "transparent",
  },
  cardName: {
    fontSize: typography.h2,
    lineHeight: lineHeights.h2,
    fontWeight: "800",
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  cardLocation: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    fontWeight: "500",
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
