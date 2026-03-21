import { useState, useCallback, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { ErrorProvider, useError } from "./lib/ErrorContext";
import ErrorOverlay from "./components/ErrorOverlay";
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import IntroversionScreen from "./screens/IntroversionScreen";
import GenderScreen from "./screens/GenderScreen";
import AgeScreen from "./screens/AgeScreen";
import PhotosScreen from "./screens/PhotosScreen";
import LocationScreen from "./screens/LocationScreen";
import ProfileCompletionScreen from "./screens/ProfileCompletionScreen";
import HomeScreen from "./screens/HomeScreen";
import MatchesScreen from "./screens/MatchesScreen";
import MeScreen from "./screens/MeScreen";
import ProfileViewScreen from "./screens/ProfileViewScreen";
import PreferencesScreen from "./screens/PreferencesScreen";
import ChatScreen from "./screens/ChatScreen";
import MatchCelebrationScreen from "./screens/MatchCelebrationScreen";
import BottomTabBar, {
  DiscoverIcon,
  InsightsIcon,
  MeIcon,
  MessageHeartIcon,
} from "./components/BottomTabBar";
import { createProfile } from "./lib/createProfile";
import { getStoredProfileId, clearProfileId, storeProfileId } from "./lib/deviceId";
import {
  fetchProfile,
  fetchProfileByEmail,
  fetchActiveMatch,
  recordSwipe,
  checkMutualMatch,
  endMatch,
  savePreferences,
  updateProfile as updateProfileApi,
  sendPushNotification,
  normalizeCountry,
} from "./lib/api";
import { supabase } from "./lib/supabase";
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  getLastNotificationResponseData,
} from "./lib/notifications";
import { colors } from "./theme";

const SCREENS = ["welcome", "introversion", "gender", "age", "photos", "location", "main"];

const TABS_DEFAULT = [
  { key: "discover", label: "Discover", Icon: DiscoverIcon },
  { key: "matches", label: "Insights", Icon: InsightsIcon },
  { key: "me", label: "Me", Icon: MeIcon },
];

const TABS_MATCHED = [
  { key: "message", label: "Message", Icon: MessageHeartIcon },
  { key: "me", label: "Me", Icon: MeIcon },
];

function MainTabs({
  profile,
  onUpdateProfile,
  onLogout,
  pendingNotificationRoute,
  onNotificationRouteHandled,
}) {
  const [activeTab, setActiveTab] = useState("discover");
  const [viewingProfile, setViewingProfile] = useState(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    const saved = profile.preferences || {};
    if (profile.location_text && !saved.location) {
      return { ...saved, location: profile.location_text };
    }
    return saved;
  });
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [timerDeadline, setTimerDeadline] = useState(null);
  const [lastSenderId, setLastSenderId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [revealProgress, setRevealProgress] = useState({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [chatInitialTab, setChatInitialTab] = useState("chat");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const active = await fetchActiveMatch(profile.id);
      if (!cancelled && active) {
        setMatchedProfile(active.profile);
        setMatchId(active.matchId);
        setTimerDeadline(active.timerDeadline);
        setLastSenderId(active.lastSenderId);
        setActiveTab("message");
      }
    })();
    return () => { cancelled = true; };
  }, [profile.id]);

  useEffect(() => {
    let cancelled = false;

    if (!pendingNotificationRoute) return undefined;

    (async () => {
      if (pendingNotificationRoute.targetTab === "message") {
        setViewingProfile(null);
        setShowPrefs(false);
        const active = await fetchActiveMatch(profile.id);
        if (cancelled) return;

        if (active) {
          setMatchedProfile(active.profile);
          setMatchId(active.matchId);
          setTimerDeadline(active.timerDeadline);
          setLastSenderId(active.lastSenderId);
          setChatInitialTab(pendingNotificationRoute.chatTab || "chat");
          setActiveTab("message");
        }

        onNotificationRouteHandled?.();
        return;
      }

      if (
        pendingNotificationRoute.targetTab === "discover" &&
        pendingNotificationRoute.targetScreen === "profile" &&
        pendingNotificationRoute.profileId
      ) {
        setShowPrefs(false);
        const targetProfile = await fetchProfile(pendingNotificationRoute.profileId);
        if (!cancelled && targetProfile) {
          setViewingProfile(targetProfile);
          setActiveTab("discover");
        }
      }

      onNotificationRouteHandled?.();
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingNotificationRoute, profile.id, onNotificationRouteHandled]);

  const handleMatch = useCallback(
    async (matched) => {
      await recordSwipe(profile.id, matched.id, "like");
      const match = await checkMutualMatch(profile.id, matched.id);
      if (match) {
        setViewingProfile(null);
        setMatchedProfile(matched);
        setMatchId(match.id);
        setTimerDeadline(match.timer_deadline);
        setLastSenderId(null);
        setShowCelebration(true);
        sendPushNotification(
          matched.id,
          "It's a match!",
          `You and ${profile.name} matched`,
          {
            type: "match",
            matchId: match.id,
            targetTab: "message",
            targetScreen: "chat",
            chatTab: "chat",
          }
        );
      } else {
        sendPushNotification(
          matched.id,
          "Someone's interested",
          `${profile.name} revealed your profile`,
          {
            type: "reveal",
            revealerId: profile.id,
            profileId: profile.id,
            targetTab: "discover",
            targetScreen: "profile",
          }
        );
        setViewingProfile(null);
      }
    },
    [profile.id, profile.name]
  );

  const handlePass = useCallback(
    async (passedProfile) => {
      await recordSwipe(profile.id, passedProfile.id, "pass");
      setViewingProfile(null);
    },
    [profile.id]
  );

  const handleCelebrationDismiss = useCallback(() => {
    setShowCelebration(false);
    setActiveTab("message");
  }, []);

  const handlePassFromChat = useCallback(async () => {
    if (matchId) await endMatch(matchId);
    setMatchedProfile(null);
    setMatchId(null);
    setTimerDeadline(null);
    setLastSenderId(null);
    setActiveTab("discover");
  }, [matchId]);

  const handleSavePrefs = useCallback(
    async (prefs) => {
      setPreferences(prefs);
      await savePreferences(profile.id, prefs);
      if (prefs.location && prefs.location !== profile.location_text) {
        const updates = { location_text: prefs.location };
        if (prefs.country) updates.country = normalizeCountry(prefs.country);
        await updateProfileApi(profile.id, updates);
        onUpdateProfile(updates);
      }
    },
    [profile.id, profile.location_text, onUpdateProfile]
  );

  if (showCompletion) {
    return (
      <ProfileCompletionScreen
        profile={profile}
        onComplete={async (data) => {
          const { prompts: savedPrompts, ...profileFields } = data;
          await updateProfileApi(profile.id, profileFields);
          const updates = { ...profileFields };
          if (savedPrompts) updates.prompts = savedPrompts;
          onUpdateProfile(updates);
          setShowCompletion(false);
        }}
        onCancel={() => setShowCompletion(false)}
        onSavePartial={async (partial) => {
          const { prompts: savedPrompts, ...profileFields } = partial;
          if (Object.keys(profileFields).length > 0) {
            await updateProfileApi(profile.id, profileFields);
          }
          onUpdateProfile(partial);
        }}
      />
    );
  }

  if (viewingProfile) {
    const extraPhotos = Math.max(0, (viewingProfile.photos?.length || 1) - 1);
    const hasPrompts = (viewingProfile.prompts?.length || 0) > 0 ? 1 : 0;
    const totalRevealable = extraPhotos + hasPrompts;
    const computedStart = totalRevealable === 0 ? Math.max(1, totalRevealable) : 0;
    const savedStage = revealProgress[viewingProfile.id];
    const initialStage = savedStage != null ? savedStage : computedStart;

    return (
      <ProfileViewScreen
        profile={viewingProfile}
        myProfile={profile}
        myProfileId={profile.id}
        initialRevealStage={initialStage}
        totalRevealable={totalRevealable}
        onBack={() => setViewingProfile(null)}
        onMatch={handleMatch}
        onPass={handlePass}
        onCompleteProfile={() => setShowCompletion(true)}
        onRevealChange={(stage) =>
          setRevealProgress((prev) => ({ ...prev, [viewingProfile.id]: stage }))
        }
      />
    );
  }

  if (showPrefs) {
    return (
      <PreferencesScreen
        profileId={profile.id}
        preferences={preferences}
        locationHidden={!!profile.location_hidden}
        onSave={handleSavePrefs}
        onLocationHiddenChange={async (hidden) => {
          await updateProfileApi(profile.id, { location_hidden: hidden });
          onUpdateProfile({ location_hidden: hidden });
        }}
        onClose={() => setShowPrefs(false)}
      />
    );
  }

  const tabs = matchedProfile ? TABS_MATCHED : TABS_DEFAULT;

  return (
    <View style={{ flex: 1 }}>
      {activeTab === "discover" && (
        <HomeScreen
          profileId={profile.id}
          myCountry={normalizeCountry(profile.country)}
          preferences={preferences}
          onViewProfile={setViewingProfile}
          onOpenPrefs={() => setShowPrefs(true)}
        />
      )}
      {activeTab === "matches" && <MatchesScreen />}
      {activeTab === "me" && (
        <MeScreen
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onLogout={onLogout}
        />
      )}
      {activeTab === "message" && matchedProfile && (
        <ChatScreen
          matchedProfile={matchedProfile}
          matchId={matchId}
          myProfileId={profile.id}
          revealStage={revealProgress[matchedProfile.id] ?? 3}
          onPass={handlePassFromChat}
          initialTab={chatInitialTab}
          initialTimerDeadline={timerDeadline}
          initialLastSenderId={lastSenderId}
        />
      )}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} tabs={tabs} />

      {showCelebration && matchedProfile && (
        <MatchCelebrationScreen
          matchedProfile={matchedProfile}
          onDismiss={handleCelebrationDismiss}
        />
      )}
    </View>
  );
}

function AppContent() {
  const { error, showError, clearError } = useError();
  const [loading, setLoading] = useState(true);
  const [screenIndex, setScreenIndex] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingNotificationRoute, setPendingNotificationRoute] = useState(null);
  const [profile, setProfile] = useState({
    name: "",
    introversion: "Introvert",
    gender: null,
    age: "",
  });

  const handleNotificationRoute = useCallback((data) => {
    if (!data) return;

    setShowLogin(false);
    setScreenIndex(SCREENS.indexOf("main"));
    setPendingNotificationRoute({
      type: data.type,
      matchId: data.matchId || null,
      profileId: data.profileId || data.revealerId || null,
      targetTab: data.targetTab || (data.type === "reveal" ? "discover" : "message"),
      targetScreen: data.targetScreen || (data.type === "reveal" ? "profile" : "chat"),
      chatTab: data.chatTab || "chat",
    });
  }, []);

  const loadApp = useCallback(async () => {
    try {
      clearError();
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }

      const storedId = await getStoredProfileId();
      if (storedId) {
        const existing = await fetchProfile(storedId);
        if (existing) {
          setProfile(existing);
          setScreenIndex(SCREENS.indexOf("main"));
          registerForPushNotifications(existing.id);
        }
      }
    } catch (e) {
      showError("Could not load your profile. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [clearError, showError]);

  useEffect(() => {
    loadApp();

    let mounted = true;

    (async () => {
      const initialNotification = await getLastNotificationResponseData();
      if (mounted && initialNotification) {
        handleNotificationRoute(initialNotification);
      }
    })();

    const sub = addNotificationResponseListener((data) => {
      handleNotificationRoute(data);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [handleNotificationRoute, loadApp]);

  const goNext = useCallback(
    async (data) => {
      const merged = { ...profile, ...data };
      setProfile(merged);

      if (SCREENS[screenIndex] === "age") {
        const saved = await createProfile({
          name: merged.name,
          introversion: merged.introversion,
          gender: merged.gender,
          age: typeof merged.age === "number" ? merged.age : parseInt(merged.age, 10),
        });
        if (saved) {
          setProfile((prev) => ({ ...prev, id: saved.id }));
        }
      }

      if (SCREENS[screenIndex] === "location" && merged.id) {
        await updateProfileApi(merged.id, {
          is_onboarded: true,
          location_text: merged.location_text || "",
          location_hidden: !!merged.location_hidden,
          country: normalizeCountry(merged.country || ""),
        });
      }

      setScreenIndex((i) => Math.min(i + 1, SCREENS.length - 1));
    },
    [profile, screenIndex]
  );

  const goBack = useCallback(() => {
    setScreenIndex((i) => Math.max(i - 1, 0));
  }, []);

  const updateProfile = useCallback((data) => {
    setProfile((prev) => ({ ...prev, ...data }));
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    await supabase.auth.signInAnonymously();
    await clearProfileId();
    setProfile({ name: "", introversion: "Introvert", gender: null, age: "" });
    setScreenIndex(0);
    setShowLogin(false);
  }, []);

  const handleLogin = useCallback(async (email) => {
    const existing = await fetchProfileByEmail(email);
    if (existing) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateProfileApi(existing.id, { user_id: user.id });
      }
      await storeProfileId(existing.id);
      setProfile(existing);
      registerForPushNotifications(existing.id);
      setScreenIndex(SCREENS.indexOf("main"));
      setShowLogin(false);
    }
  }, []);

  if (error) {
    return <ErrorOverlay message={error} onRetry={loadApp} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.oceanAbyss, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.tealGlow} />
      </View>
    );
  }

  if (showLogin) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onBack={() => setShowLogin(false)}
      />
    );
  }

  const screen = SCREENS[screenIndex];

  switch (screen) {
    case "welcome":
      return (
        <WelcomeScreen
          initialName={profile.name}
          onNext={goNext}
          onUpdate={updateProfile}
          onLoginPress={() => setShowLogin(true)}
        />
      );
    case "introversion":
      return (
        <IntroversionScreen
          initialValue={profile.introversion}
          onNext={goNext}
          onBack={goBack}
          onUpdate={updateProfile}
        />
      );
    case "gender":
      return (
        <GenderScreen
          initialValue={profile.gender}
          onNext={goNext}
          onBack={goBack}
          onUpdate={updateProfile}
        />
      );
    case "age":
      return (
        <AgeScreen
          initialValue={profile.age}
          onNext={goNext}
          onBack={goBack}
          onUpdate={updateProfile}
        />
      );
    case "photos":
      return (
        <PhotosScreen
          profileId={profile.id}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case "location":
      return (
        <LocationScreen
          initialLocation={profile.location_text}
          initialHidden={profile.location_hidden}
          initialCountry={profile.country}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case "main":
      return (
        <MainTabs
          profile={profile}
          onUpdateProfile={updateProfile}
          onLogout={handleLogout}
          pendingNotificationRoute={pendingNotificationRoute}
          onNotificationRouteHandled={() => setPendingNotificationRoute(null)}
        />
      );
    default:
      return <WelcomeScreen initialName={profile.name} onNext={goNext} onUpdate={updateProfile} />;
  }
}

export default function App() {
  return (
    <ErrorProvider>
      <AppContent />
    </ErrorProvider>
  );
}
