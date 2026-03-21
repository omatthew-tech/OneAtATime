import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";
import {
  colors,
  spacing,
  typography,
  lineHeights,
  radius,
  sizes,
} from "../theme";
import ActionSheet from "../components/ActionSheet";
import {
  fetchMessages,
  sendMessage as sendMessageApi,
  endMatch,
  blockUser,
  reportUser,
  markWeMet,
  sendPushNotification,
  toggleMessageLike,
  resetMatchTimer,
} from "../lib/api";
import { supabase } from "../lib/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PROFILE_PHOTO_WIDTH = SCREEN_WIDTH - spacing.sm * 2;
const PROFILE_PHOTO_HEIGHT = PROFILE_PHOTO_WIDTH * 1.25;

const REVEAL_THRESHOLDS = [1, 2, 3, 5, 8, 13];
const INFO_IDS = [
  "height",
  "job",
  "school",
  "religion",
  "politics",
];

function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = hashStr(String(seed));
  for (let i = result.length - 1; i > 0; i--) {
    s = ((s * 16807) % 2147483647) | 0;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function DotsIcon({ size = 24, color = colors.textPrimary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <SvgPath d="M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z" />
    </Svg>
  );
}

function SendIcon({ size = 22, color = colors.oceanAbyss }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
    >
      <SvgPath
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StrokeIcon({ paths, size = 18, color = colors.textMuted }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d, i) => (
        <SvgPath key={i} d={d} />
      ))}
    </Svg>
  );
}

const ICON = {
  person: [
    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2",
    "M16 7a4 4 0 11-8 0 4 4 0 118 0z",
  ],
  activity: ["M22 12h-4l-3 9L9 3l-3 9H2"],
  ruler: [
    "M3 5v14",
    "M3 5h4",
    "M3 9h2.5",
    "M3 13h4",
    "M3 17h2.5",
    "M3 19h4",
  ],
  briefcase: [
    "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z",
    "M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
  ],
  bookOpen: [
    "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z",
    "M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  ],
  book: [
    "M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20",
  ],
  landmark: [
    "M3 22h18",
    "M6 18v-7",
    "M10 18v-7",
    "M14 18v-7",
    "M18 18v-7",
    "M12 2l9 9H3z",
  ],
};

const DETAIL_ROWS = [
  { id: "job", icon: ICON.briefcase, w1: "70%", w2: "42%", r1: "-0.4deg", r2: "0.3deg" },
  { id: "school", icon: ICON.bookOpen, w1: "62%", w2: "38%", r1: "0.3deg", r2: "-0.5deg" },
  { id: "religion", icon: ICON.book, w1: "55%", w2: "35%", r1: "-0.2deg", r2: "0.6deg" },
  { id: "politics", icon: ICON.landmark, w1: "52%", w2: "32%", r1: "-0.6deg", r2: "0.2deg" },
];

const STARTER_MESSAGES = [
  "Hey, what's your favorite thing to do around here?",
  "Your bio made me smile",
  "If you could travel anywhere tomorrow, where?",
  "What's the best meal you've had recently?",
];

// ─── Profile tab components ──────────────────────────

function StatChip({ icon, label }) {
  return (
    <View style={pStyles.statChip}>
      <StrokeIcon paths={icon} size={16} color={colors.textMuted} />
      <Text style={pStyles.statChipText}>{label}</Text>
    </View>
  );
}

function HeightChip({ revealed, animating, revealAnim, value }) {
  return (
    <View style={pStyles.statChip}>
      <StrokeIcon
        paths={ICON.ruler}
        size={16}
        color={revealed ? colors.textSecondary : colors.textMuted}
      />
      <View style={{ position: "relative" }}>
        {(revealed || animating) && (
          <Text style={pStyles.statChipText}>{value || "—"}</Text>
        )}
        {(!revealed || animating) && (
          <Animated.View
            style={[
              revealed || animating
                ? pStyles.statScribbleAbsolute
                : pStyles.statScribbleInline,
              animating && { opacity: revealAnim },
            ]}
          >
            <View style={[pStyles.miniScribble, { width: 30 }]} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function ChatProfilePhoto({ uri, revealed, animating, revealAnim }) {
  return (
    <View style={pStyles.photoContainer}>
      <Image source={{ uri }} style={pStyles.photo} />
      {(!revealed || animating) && (
        <Animated.View
          style={[pStyles.photoBlur, animating && { opacity: revealAnim }]}
        />
      )}
    </View>
  );
}

function ChatPromptCard({ prompt, revealed }) {
  return (
    <View style={pStyles.promptCard}>
      <Text style={pStyles.promptLabel}>{prompt.prompt_text}</Text>
      {revealed ? (
        <Text style={pStyles.promptAnswer}>{prompt.answer}</Text>
      ) : (
        <View style={pStyles.promptScribbles}>
          <View
            style={[
              pStyles.scribble,
              { width: "92%", transform: [{ rotate: "-0.3deg" }] },
            ]}
          />
          <View
            style={[
              pStyles.scribble,
              {
                width: "74%",
                transform: [{ rotate: "0.5deg" }],
                marginTop: -3,
              },
            ]}
          />
          <View
            style={[
              pStyles.scribble,
              {
                width: "55%",
                transform: [{ rotate: "-0.2deg" }],
                marginTop: -3,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

function DetailRowItem({
  icon,
  w1,
  w2,
  r1,
  r2,
  revealed,
  animating,
  revealAnim,
  value,
}) {
  const showValue = revealed || animating;
  const showScribble = !revealed || animating;

  return (
    <View style={pStyles.detailRow}>
      <StrokeIcon
        paths={icon}
        size={18}
        color={showValue ? colors.textSecondary : colors.textMuted}
      />
      <View style={pStyles.detailRowContent}>
        {showValue && (
          <Text style={pStyles.detailRowValue}>{value || "—"}</Text>
        )}
        {showScribble && (
          <Animated.View
            style={[
              showValue && pStyles.scribbleOverlay,
              animating && { opacity: revealAnim },
            ]}
          >
            <View
              style={[
                pStyles.scribble,
                { width: w1, transform: [{ rotate: r1 }] },
              ]}
            />
            <View
              style={[
                pStyles.scribble,
                { width: w2, transform: [{ rotate: r2 }], marginTop: -2 },
              ]}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const HEART_PATH =
  "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z";

const TOGGLE_HEART_CONFIGS = [
  { size: 26, x: -24, y: -30, delay: 0, drift: -14 },
  { size: 22, x: 38, y: -28, delay: 200, drift: 16 },
  { size: 20, x: 8, y: -34, delay: 400, drift: -8 },
];

function ToggleHeartBurst({ visible }) {
  const anims = useRef(
    TOGGLE_HEART_CONFIGS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!visible) {
      anims.forEach((a) => {
        a.opacity.setValue(0);
        a.translateY.setValue(0);
        a.scale.setValue(0);
      });
      return;
    }

    anims.forEach((a, i) => {
      const cfg = TOGGLE_HEART_CONFIGS[i];
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(a.scale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(a.opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(a.translateY, {
            toValue: cfg.drift,
            duration: 700,
            useNativeDriver: true,
          }),
        ]).start(() => {
          Animated.parallel([
            Animated.timing(a.opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(a.scale, {
              toValue: 0.5,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, cfg.delay);
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {TOGGLE_HEART_CONFIGS.map((cfg, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: cfg.x,
            top: cfg.y,
            opacity: anims[i].opacity,
            transform: [
              { translateY: anims[i].translateY },
              { scale: anims[i].scale },
            ],
            zIndex: 20,
          }}
        >
          <Svg
            width={cfg.size}
            height={cfg.size}
            viewBox="0 0 24 24"
            fill={colors.tealGlow}
          >
            <SvgPath d={HEART_PATH} />
          </Svg>
        </Animated.View>
      ))}
    </>
  );
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const TIMER_COLOR = "rgba(255,255,255,0.35)";
const TIMER_COLOR_LOW = "rgba(255,80,80,0.6)";

function HourglassIcon({ progress, color, size = 16 }) {
  const topH = 5 * progress;
  const botH = 5 * (1 - progress);
  const topY = 5 + (5 - topH);
  const botY = 13;
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <SvgPath
        d="M5 3 H15 V5 L12 10 L15 15 V17 H5 V15 L8 10 L5 5 Z"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
      />
      {topH > 0.2 && (
        <SvgPath
          d={`M7.5 ${topY} L10 ${topY + topH * 0.6} L12.5 ${topY} Z`}
          fill={color}
        />
      )}
      {botH > 0.2 && (
        <SvgPath
          d={`M7.5 ${botY + (5 - botH)} L10 ${botY + 5} L12.5 ${botY + (5 - botH)} Z`}
          fill={color}
        />
      )}
    </Svg>
  );
}

function CountdownTimer({ deadline, onExpire, onPress }) {
  const [remaining, setRemaining] = useState(() => {
    const ms = new Date(deadline).getTime() - Date.now();
    return Math.max(0, ms);
  });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevDeadline = useRef(deadline);

  useEffect(() => {
    if (deadline !== prevDeadline.current) {
      prevDeadline.current = deadline;
      setRemaining(Math.max(0, new Date(deadline).getTime() - Date.now()));
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
      ]).start();
    }
  }, [deadline, pulseAnim]);

  useEffect(() => {
    const tick = setInterval(() => {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining(0);
        clearInterval(tick);
        onExpire?.();
      } else {
        setRemaining(ms);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [deadline, onExpire]);

  const totalSec = Math.ceil(remaining / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const label = `${hrs}:${String(mins).padStart(2, "0")}`;
  const isLow = remaining < 2 * 60 * 60 * 1000;
  const color = isLow ? TIMER_COLOR_LOW : TIMER_COLOR;
  const progress = Math.min(remaining / TWENTY_FOUR_HOURS, 1);

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[timerStyles.row, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[timerStyles.label, { color }]}>{label}</Text>
        <HourglassIcon progress={progress} color={color} size={16} />
      </Animated.View>
    </Pressable>
  );
}

const timerStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: typography.body,
    fontWeight: "500",
  },
});

function MessageBubble({ message, isMe, onDoubleTap }) {
  const lastTap = useRef(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const [showHeartPop, setShowHeartPop] = useState(false);
  const liked = !!message.liked_by;

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTap?.(message.id);
      if (!liked) {
        setShowHeartPop(true);
        heartScale.setValue(0);
        Animated.sequence([
          Animated.spring(heartScale, { toValue: 1.2, useNativeDriver: true, speed: 20, bounciness: 12 }),
          Animated.timing(heartScale, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.delay(400),
          Animated.timing(heartScale, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setShowHeartPop(false));
      }
    }
    lastTap.current = now;
  };

  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <Pressable onPress={handlePress} style={styles.bubbleWrap}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {message.body}
          </Text>
        </View>
        {liked && !showHeartPop && (
          <View style={[styles.likedHeart, isMe ? styles.likedHeartMe : styles.likedHeartThem]}>
            <Text style={{ fontSize: 14 }}>❤️</Text>
          </View>
        )}
        {showHeartPop && (
          <Animated.View
            style={[
              styles.heartPop,
              { transform: [{ scale: heartScale }] },
            ]}
          >
            <Text style={{ fontSize: 28 }}>❤️</Text>
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

// ─── Main component ──────────────────────────────────

export default function ChatScreen({
  matchedProfile,
  matchId,
  myProfileId,
  revealStage = 3,
  onPass,
  initialTab = "chat",
  initialTimerDeadline,
  initialLastSenderId,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [tab, setTab] = useState(initialTab);
  const [myMsgCount, setMyMsgCount] = useState(0);
  const [pendingRevealIds, setPendingRevealIds] = useState([]);
  const [queuedRevealIds, setQueuedRevealIds] = useState([]);
  const [showChatHeart, setShowChatHeart] = useState(false);
  const [profileGlow, setProfileGlow] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showToast, setShowToast] = useState("");
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerDeadline, setTimerDeadline] = useState(initialTimerDeadline);
  const [lastSenderId, setLastSenderId] = useState(initialLastSenderId);

  const listRef = useRef(null);
  const initializedRef = useRef(false);
  const profileScrollRef = useRef(null);
  const sectionY = useRef({});
  const rowY = useRef({});
  const revealAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const glowLoop = useRef(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const hasSentMessage = messages.some((m) => m.sender_id === myProfileId);

  const maxPhotoIndex = Math.min(
    revealStage,
    (matchedProfile.photos?.length || 1) - 1
  );
  const promptsRevealed = revealStage >= 3;

  // Build deterministic reveal sequence: info, photo, info, photo, ...
  const revealSequence = useMemo(() => {
    const shuffled = seededShuffle(INFO_IDS, matchId || "default");
    const unrevealed = [];
    const photos = matchedProfile.photos || [];
    for (let i = maxPhotoIndex + 1; i < photos.length; i++) {
      unrevealed.push(i);
    }

    const seq = [];
    let ii = 0;
    let pi = 0;
    while (ii < shuffled.length || pi < unrevealed.length) {
      if (ii < shuffled.length) seq.push({ type: "info", id: shuffled[ii++] });
      if (pi < unrevealed.length)
        seq.push({ type: "photo", index: unrevealed[pi++] });
    }
    return seq;
  }, [matchId, maxPhotoIndex, matchedProfile.photos]);

  const isRevealed = useCallback(
    (itemId) => {
      const met = REVEAL_THRESHOLDS.filter((t) => myMsgCount >= t).length;
      if (met >= REVEAL_THRESHOLDS.length) return true;
      for (let i = 0; i < Math.min(met, revealSequence.length); i++) {
        const item = revealSequence[i];
        const id =
          item.type === "photo" ? `photo-${item.index}` : item.id;
        if (id === itemId) return true;
      }
      return false;
    },
    [myMsgCount, revealSequence]
  );

  const getRevealedValue = useCallback(
    (id) => {
      const p = matchedProfile;
      switch (id) {
        case "height":
          return p.height || null;
        case "job":
          return p.job || null;
        case "school":
          return p.school || null;
        case "religion":
          return p.religion || null;
        case "politics":
          return p.politics || null;
        default:
          return null;
      }
    },
    [matchedProfile]
  );

  const getScrollTarget = useCallback((itemId) => {
    if (itemId === "height") return sectionY.current["stats"] || 0;
    if (itemId.startsWith("photo-")) return sectionY.current[itemId] || 0;
    return (
      (sectionY.current["details"] || 0) + (rowY.current[itemId] || 0)
    );
  }, []);

  // ─── Messages ─────────────────────────────────

  const loadMessages = useCallback(async () => {
    if (!matchId) return;
    const data = await fetchMessages(matchId);
    setMessages(data);
    if (!initializedRef.current && data) {
      initializedRef.current = true;
      const count = data.filter((m) => m.sender_id === myProfileId).length;
      setMyMsgCount(count);
    }
  }, [matchId, myProfileId]);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          if (payload.new.timer_deadline) {
            setTimerDeadline(payload.new.timer_deadline);
          }
          if (payload.new.last_sender_id !== undefined) {
            setLastSenderId(payload.new.last_sender_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, loadMessages]);

  // ─── Reveal logic ─────────────────────────────

  const startProfileGlow = useCallback(() => {
    setProfileGlow(true);
    glowAnim.setValue(0);
    glowLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.current.start();
  }, [glowAnim]);

  const stopProfileGlow = useCallback(() => {
    glowLoop.current?.stop();
    glowAnim.setValue(0);
    setProfileGlow(false);
  }, [glowAnim]);

  const triggerReveal = useCallback(
    (ids) => {
      setShowChatHeart(true);
      setQueuedRevealIds(ids);

      setTimeout(() => {
        setShowChatHeart(false);
        startProfileGlow();
      }, 1200);
    },
    [startProfileGlow]
  );

  const handleProfileTabPress = useCallback(() => {
    setTab("profile");

    if (queuedRevealIds.length > 0) {
      stopProfileGlow();
      const ids = queuedRevealIds;
      setQueuedRevealIds([]);

      setTimeout(() => {
        if (ids.length === 1) {
          const y = getScrollTarget(ids[0]);
          profileScrollRef.current?.scrollTo({
            y: Math.max(0, y - 60),
            animated: true,
          });
        } else {
          profileScrollRef.current?.scrollTo({ y: 0, animated: true });
        }

        setTimeout(() => {
          setPendingRevealIds(ids);
          revealAnim.setValue(1);
          Animated.timing(revealAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }).start(() => {
            setPendingRevealIds([]);
          });
        }, 600);
      }, 400);
    }
  }, [queuedRevealIds, stopProfileGlow, getScrollTarget, revealAnim]);

  const sendingRef = useRef(false);

  const sendMessage = async (text) => {
    const body = text.trim();
    if (!body || !matchId || sendingRef.current) return;
    sendingRef.current = true;
    setInputText("");

    const msg = await sendMessageApi(matchId, myProfileId, body);
    sendingRef.current = false;
    if (msg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      const newCount = myMsgCount + 1;
      setMyMsgCount(newCount);

      if (lastSenderId !== myProfileId) {
        const newDeadline = await resetMatchTimer(matchId, myProfileId);
        setTimerDeadline(newDeadline);
        setLastSenderId(myProfileId);
      }

      sendPushNotification(
        matchedProfile.id,
        matchedProfile.name ? `${matchedProfile.name}` : "New message",
        body.slice(0, 100),
        {
          type: "message",
          matchId,
          targetTab: "message",
          targetScreen: "chat",
          chatTab: "chat",
        }
      );

      const thresholdIdx = REVEAL_THRESHOLDS.indexOf(newCount);
      if (thresholdIdx !== -1 && pendingRevealIds.length === 0) {
        sendPushNotification(
          matchedProfile.id,
          "New reveal!",
          `${matchedProfile.name || "Someone"} just uncovered something about you`,
          {
            type: "chat-reveal",
            matchId,
            targetTab: "message",
            targetScreen: "chat",
            chatTab: "profile",
          }
        );

        const isLast = thresholdIdx === REVEAL_THRESHOLDS.length - 1;

        if (isLast) {
          const alreadyCount = REVEAL_THRESHOLDS.length - 1;
          const remaining = revealSequence
            .slice(alreadyCount)
            .map((item) =>
              item.type === "photo" ? `photo-${item.index}` : item.id
            );
          if (remaining.length > 0) triggerReveal(remaining);
        } else if (thresholdIdx < revealSequence.length) {
          const item = revealSequence[thresholdIdx];
          const id =
            item.type === "photo" ? `photo-${item.index}` : item.id;
          triggerReveal([id]);
        }
      }
    }
  };

  const handleActionSelect = (action) => {
    if (action === "pass") {
      setShowPassConfirm(true);
    } else if (action === "block") {
      setShowBlockConfirm(true);
    } else if (action === "report") {
      setShowReportModal(true);
    } else if (action === "we-met") {
      handleWeMet();
    }
  };

  const handleBlock = async () => {
    setShowBlockConfirm(false);
    await blockUser(myProfileId, matchedProfile.id);
    if (matchId) await endMatch(matchId);
    onPass?.();
  };

  const handleReport = async (reason) => {
    setShowReportModal(false);
    await reportUser(myProfileId, matchedProfile.id, reason);
    setShowToast("Report submitted. Thank you for keeping our community safe.");
    setTimeout(() => setShowToast(""), 3000);
  };

  const handleWeMet = async () => {
    if (matchId) await markWeMet(matchId);
    setShowToast("That's great! We'll use this to improve your matches.");
    setTimeout(() => setShowToast(""), 3000);
  };

  const handleDoubleTap = useCallback(async (messageId) => {
    const newVal = await toggleMessageLike(messageId, myProfileId);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, liked_by: newVal } : m))
    );
  }, [myProfileId]);

  const renderMessage = ({ item }) => (
    <MessageBubble
      message={item}
      isMe={item.sender_id === myProfileId}
      onDoubleTap={handleDoubleTap}
    />
  );

  // ─── Content builder ──────────────────────────

  const profileContent = useMemo(() => {
    const items = [];
    const photos = matchedProfile.photos || [];
    const prompts = matchedProfile.prompts || [];
    const maxLen = Math.max(photos.length, prompts.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < photos.length) {
        items.push({ type: "photo", uri: photos[i], index: i });
      }
      if (i < prompts.length) {
        items.push({ type: "prompt", data: prompts[i] });
      }
      if (i === 0) {
        items.push({ type: "stats" });
        items.push({ type: "details" });
      }
    }
    if (maxLen === 0) {
      items.push({ type: "stats" });
      items.push({ type: "details" });
    }
    return items;
  }, [matchedProfile]);

  // ─── Shared input bar ─────────────────────────

  const inputBar = (
    <View style={styles.inputBar}>
      <TextInput
        style={styles.input}
        value={inputText}
        onChangeText={setInputText}
        placeholder="Send a message"
        placeholderTextColor={colors.textMuted}
        onSubmitEditing={() => sendMessage(inputText)}
        returnKeyType="send"
      />
      <Pressable
        style={[
          styles.sendButton,
          !inputText.trim() && styles.sendButtonDisabled,
        ]}
        onPress={() => sendMessage(inputText)}
        disabled={!inputText.trim()}
      >
        <SendIcon />
      </Pressable>
    </View>
  );

  // ─── Render ───────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Pressable
              style={styles.dotsButton}
              onPress={() => setShowActions(true)}
            >
              <DotsIcon />
            </Pressable>
          </View>
          <Text style={styles.headerName}>{matchedProfile.name}</Text>
          <View style={[styles.headerSide, { alignItems: "flex-end" }]}>
            {timerDeadline ? (
              <CountdownTimer
                deadline={timerDeadline}
                onExpire={() => onPass?.()}
                onPress={() => setShowTimerModal(true)}
              />
            ) : (
              <Pressable onPress={() => setShowPassConfirm(true)}>
                <Text style={styles.passText}>pass</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.toggleBar}>
          <View style={styles.toggle}>
            <Pressable
              style={[
                styles.toggleTab,
                tab === "chat" && styles.toggleTabActive,
              ]}
              onPress={() => setTab("chat")}
            >
              <Text
                style={[
                  styles.toggleText,
                  tab === "chat" && styles.toggleTextActive,
                ]}
              >
                Chat
              </Text>
            </Pressable>
            <Animated.View
              style={[
                styles.profileToggleWrap,
                profileGlow && {
                  shadowColor: colors.tealGlow,
                  shadowOpacity: glowAnim,
                  shadowRadius: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 14],
                  }),
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                },
              ]}
            >
              <Pressable
                style={[
                  styles.toggleTab,
                  tab === "profile" && styles.toggleTabActive,
                  profileGlow && styles.toggleTabGlow,
                ]}
                onPress={handleProfileTabPress}
              >
                <Text
                  style={[
                    styles.toggleText,
                    tab === "profile" && styles.toggleTextActive,
                    profileGlow && styles.toggleTextGlow,
                  ]}
                >
                  Profile
                </Text>
              </Pressable>
              <ToggleHeartBurst visible={showChatHeart} />
            </Animated.View>
          </View>
        </View>

        {tab === "chat" ? (
          <KeyboardAvoidingView
            style={styles.chatArea}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
            />

            <Text style={styles.doubleTapHint}>
              Double tap to like a message
            </Text>

            {!hasSentMessage && (
              <View style={styles.starterSection}>
                <Text style={styles.starterLabel}>
                  Choose your starting line:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.starterScroll}
                >
                  {STARTER_MESSAGES.map((msg, i) => (
                    <Pressable
                      key={i}
                      style={styles.starterPill}
                      onPress={() => sendMessage(msg)}
                    >
                      <Text style={styles.starterPillText}>{msg}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {inputBar}
          </KeyboardAvoidingView>
        ) : (
          <KeyboardAvoidingView
            style={styles.chatArea}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              ref={profileScrollRef}
              contentContainerStyle={pStyles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={pStyles.revealHeader}>
                {myMsgCount >= REVEAL_THRESHOLDS[REVEAL_THRESHOLDS.length - 1]
                  ? "You've revealed everything. It's a good time to make your next move..."
                  : "The more you chat, the more you reveal"}
              </Text>

              {profileContent.map((item, idx) => {
                switch (item.type) {
                  case "photo": {
                    const photoId = `photo-${item.index}`;
                    const preRevealed = item.index <= maxPhotoIndex;
                    const chatRevealed = isRevealed(photoId);
                    const revealed = preRevealed || chatRevealed;
                    const animating = pendingRevealIds.includes(photoId);

                    return (
                      <View
                        key={`ph-${idx}`}
                        onLayout={(e) => {
                          sectionY.current[photoId] =
                            e.nativeEvent.layout.y;
                        }}
                      >
                        <ChatProfilePhoto
                          uri={item.uri}
                          revealed={revealed}
                          animating={animating}
                          revealAnim={revealAnim}
                        />
                      </View>
                    );
                  }
                  case "prompt":
                    return (
                      <ChatPromptCard
                        key={`pr-${idx}`}
                        prompt={item.data}
                        revealed={promptsRevealed}
                      />
                    );
                  case "stats":
                    return (
                      <View
                        key="stats"
                        onLayout={(e) => {
                          sectionY.current["stats"] =
                            e.nativeEvent.layout.y;
                        }}
                      >
                        <View style={pStyles.statsRow}>
                          <StatChip
                            icon={ICON.person}
                            label={String(matchedProfile.age)}
                          />
                          <StatChip
                            icon={ICON.person}
                            label={matchedProfile.gender}
                          />
                          <StatChip
                            icon={ICON.activity}
                            label={matchedProfile.introversion}
                          />
                          {(!(isRevealed("height") && !pendingRevealIds.includes("height")) || getRevealedValue("height")) && (
                            <HeightChip
                              revealed={isRevealed("height")}
                              animating={pendingRevealIds.includes("height")}
                              revealAnim={revealAnim}
                              value={getRevealedValue("height")}
                            />
                          )}
                        </View>
                      </View>
                    );
                  case "details": {
                    const visibleRows = DETAIL_ROWS.filter((row) => {
                      const revealed = isRevealed(row.id);
                      const animating = pendingRevealIds.includes(row.id);
                      if (revealed && !animating && !getRevealedValue(row.id)) return false;
                      return true;
                    });
                    if (visibleRows.length === 0) return null;
                    return (
                      <View
                        key="details"
                        onLayout={(e) => {
                          sectionY.current["details"] =
                            e.nativeEvent.layout.y;
                        }}
                        style={pStyles.detailsSection}
                      >
                        {visibleRows.map((row) => {
                          const revealed = isRevealed(row.id);
                          const animating =
                            pendingRevealIds.includes(row.id);
                          return (
                            <View
                              key={row.id}
                              onLayout={(e) => {
                                rowY.current[row.id] =
                                  e.nativeEvent.layout.y;
                              }}
                            >
                              <DetailRowItem
                                {...row}
                                revealed={revealed}
                                animating={animating}
                                revealAnim={revealAnim}
                                value={getRevealedValue(row.id)}
                              />
                            </View>
                          );
                        })}
                      </View>
                    );
                  }
                  default:
                    return null;
                }
              })}
            </ScrollView>

            {inputBar}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      <Modal
        visible={showTimerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimerModal(false)}
      >
        <Pressable
          style={styles.passOverlay}
          onPress={() => setShowTimerModal(false)}
        >
          <View style={styles.passModal}>
            <View style={styles.timerModalHeader}>
              {timerDeadline && (
                <CountdownTimer
                  deadline={timerDeadline}
                  onExpire={() => { setShowTimerModal(false); onPass?.(); }}
                />
              )}
            </View>
            <Text style={styles.passModalBody}>
              You'll automatically pass if your match doesn't respond within 24 hours. You can also choose to pass now.
            </Text>
            <View style={styles.passModalButtons}>
              <Pressable
                style={styles.passModalCancel}
                onPress={() => setShowTimerModal(false)}
              >
                <Text style={styles.passModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.passModalConfirm}
                onPress={() => {
                  setShowTimerModal(false);
                  onPass?.();
                }}
              >
                <Text style={styles.passModalConfirmText}>Pass</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showPassConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPassConfirm(false)}
      >
        <Pressable
          style={styles.passOverlay}
          onPress={() => setShowPassConfirm(false)}
        >
          <View style={styles.passModal}>
            <Text style={styles.passModalTitle}>Pass</Text>
            <Text style={styles.passModalBody}>
              Are you sure? You'll start matching with someone new, and you
              won't be able to see or message {matchedProfile.name} again.
            </Text>
            <View style={styles.passModalButtons}>
              <Pressable
                style={styles.passModalCancel}
                onPress={() => setShowPassConfirm(false)}
              >
                <Text style={styles.passModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.passModalConfirm}
                onPress={() => {
                  setShowPassConfirm(false);
                  onPass?.();
                }}
              >
                <Text style={styles.passModalConfirmText}>Pass</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showBlockConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockConfirm(false)}
      >
        <Pressable
          style={styles.passOverlay}
          onPress={() => setShowBlockConfirm(false)}
        >
          <View style={styles.passModal}>
            <Text style={styles.passModalTitle}>Block</Text>
            <Text style={styles.passModalBody}>
              {matchedProfile.name} will no longer be able to see your profile
              or message you, and you won't see them again.
            </Text>
            <View style={styles.passModalButtons}>
              <Pressable
                style={styles.passModalCancel}
                onPress={() => setShowBlockConfirm(false)}
              >
                <Text style={styles.passModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.passModalConfirm}
                onPress={handleBlock}
              >
                <Text style={styles.passModalConfirmText}>Block</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <Pressable
          style={styles.passOverlay}
          onPress={() => setShowReportModal(false)}
        >
          <Pressable style={styles.passModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.passModalTitle}>Report</Text>
            <Text style={styles.passModalBody}>
              Why are you reporting {matchedProfile.name}?
            </Text>
            {[
              "Inappropriate photos",
              "Spam or scam",
              "Abusive behavior",
              "Underage user",
              "Other",
            ].map((reason) => (
              <Pressable
                key={reason}
                style={styles.reportOption}
                onPress={() => handleReport(reason)}
              >
                <Text style={styles.reportOptionText}>{reason}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.passModalCancel, { marginTop: spacing.sm }]}
              onPress={() => setShowReportModal(false)}
            >
              <Text style={styles.passModalCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {showToast ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{showToast}</Text>
        </View>
      ) : null}

      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        onSelect={handleActionSelect}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────

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
    paddingVertical: spacing.xs,
  },
  passText: {
    fontSize: typography.body,
    fontWeight: "500",
    color: "rgba(255,255,255,0.35)",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  headerSide: {
    width: 80,
  },
  headerName: {
    flex: 1,
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  dotsButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  toggleBar: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggle: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.pill,
    padding: spacing.xxs,
  },
  toggleTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
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
  profileToggleWrap: {
    borderRadius: radius.pill,
  },
  toggleTabGlow: {},
  toggleTextGlow: {
    color: colors.tealGlow,
  },

  chatArea: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bubbleRowMe: {
    justifyContent: "flex-end",
  },
  bubbleWrap: {
    maxWidth: "75%",
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  bubbleThem: {
    backgroundColor: colors.oceanDeep,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: colors.tealGlow,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  bubbleTextMe: {
    color: colors.oceanAbyss,
  },
  likedHeart: {
    position: "absolute",
    bottom: -8,
  },
  likedHeartMe: {
    right: 4,
  },
  likedHeartThem: {
    left: 4,
  },
  heartPop: {
    position: "absolute",
    alignSelf: "center",
    top: "30%",
  },

  doubleTapHint: {
    textAlign: "center",
    fontSize: typography.caption,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },

  starterSection: {
    paddingBottom: spacing.xs,
  },
  starterLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  starterScroll: {
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  starterPill: {
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    maxWidth: 220,
  },
  starterPillText: {
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    height: sizes.inputHeightMd,
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  sendButton: {
    width: sizes.buttonHeightMd,
    height: sizes.buttonHeightMd,
    borderRadius: sizes.buttonHeightMd / 2,
    backgroundColor: colors.tealGlow,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },

  passOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  passModal: {
    width: "100%",
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  timerModalHeader: {
    marginBottom: spacing.xs,
  },
  passModalTitle: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  passModalBody: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  passModalButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  passModalCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.oceanMid,
  },
  passModalCancelText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  passModalConfirm: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.tealGlow,
  },
  passModalConfirmText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.oceanAbyss,
  },
});

const pStyles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  revealHeader: {
    fontSize: typography.bodySmall,
    fontWeight: "600",
    fontStyle: "italic",
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  photoContainer: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  photo: {
    width: PROFILE_PHOTO_WIDTH,
    height: PROFILE_PHOTO_HEIGHT,
    resizeMode: "cover",
  },
  photoBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 22, 40, 0.88)",
  },

  promptCard: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  promptLabel: {
    fontSize: typography.bodySmall,
    fontWeight: "500",
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  promptAnswer: {
    fontSize: typography.title,
    lineHeight: lineHeights.title,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  promptScribbles: {
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  statChipText: {
    fontSize: typography.bodySmall,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  statScribbleAbsolute: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    backgroundColor: colors.oceanDeep,
  },
  statScribbleInline: {
    justifyContent: "center",
    height: 16,
  },
  miniScribble: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.oceanMid,
  },

  detailsSection: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowContent: {
    flex: 1,
    justifyContent: "center",
    minHeight: 20,
  },
  detailRowValue: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
  },
  scribbleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    backgroundColor: colors.oceanDeep,
    paddingVertical: 2,
  },
  scribble: {
    height: 14,
    borderRadius: 6,
    backgroundColor: colors.oceanMid,
  },

  reportOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.oceanMid,
    marginTop: spacing.xs,
  },
  reportOptionText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },

  toast: {
    position: "absolute",
    bottom: 100,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.tealGlow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  toastText: {
    fontSize: typography.bodySmall,
    color: colors.tealGlow,
    fontWeight: "600",
    textAlign: "center",
  },
});
