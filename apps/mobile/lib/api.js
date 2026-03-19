import { supabase } from "./supabase";

const COUNTRY_NAMES = {
  US: "United States", CA: "Canada", GB: "United Kingdom", UK: "United Kingdom",
  AU: "Australia", NZ: "New Zealand", IE: "Ireland", DE: "Germany", FR: "France",
  ES: "Spain", IT: "Italy", PT: "Portugal", NL: "Netherlands", BE: "Belgium",
  AT: "Austria", CH: "Switzerland", SE: "Sweden", NO: "Norway", DK: "Denmark",
  FI: "Finland", PL: "Poland", CZ: "Czech Republic", RO: "Romania", HU: "Hungary",
  GR: "Greece", TR: "Turkey", RU: "Russia", UA: "Ukraine", BR: "Brazil",
  MX: "Mexico", AR: "Argentina", CO: "Colombia", CL: "Chile", PE: "Peru",
  JP: "Japan", KR: "South Korea", CN: "China", IN: "India", PH: "Philippines",
  TH: "Thailand", VN: "Vietnam", MY: "Malaysia", SG: "Singapore", ID: "Indonesia",
  ZA: "South Africa", NG: "Nigeria", EG: "Egypt", KE: "Kenya", GH: "Ghana",
  IL: "Israel", AE: "United Arab Emirates", SA: "Saudi Arabia", PK: "Pakistan",
};

const NAME_TO_CODE = Object.fromEntries(
  Object.entries(COUNTRY_NAMES).map(([code, name]) => [name.toLowerCase(), code])
);

export function normalizeCountry(raw) {
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (COUNTRY_NAMES[upper]) return upper;
  const lower = raw.toLowerCase();
  if (NAME_TO_CODE[lower]) return NAME_TO_CODE[lower];
  return raw;
}

function displayCountry(raw) {
  if (!raw) return "";
  return COUNTRY_NAMES[raw] || COUNTRY_NAMES[raw.toUpperCase()] || raw;
}

export async function fetchProfile(profileId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    console.error("fetchProfile:", error.message);
    return null;
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("profile_id", profileId)
    .order("display_order");

  const { data: prompts } = await supabase
    .from("prompt_answers")
    .select("*")
    .eq("profile_id", profileId)
    .order("display_order");

  return {
    ...profile,
    photos: (photos || []).map((p) => p.public_url),
    photoRows: photos || [],
    prompts: prompts || [],
  };
}

export async function updateProfile(profileId, fields) {
  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    console.error("updateProfile:", error.message);
    return null;
  }
  return data;
}

export async function fetchDiscoverFeed(profileId, preferences = {}, mode = "local", myCountry = "") {
  const { ageMin = 18, ageMax = 99, interestedIn = {} } = preferences;

  const genders = Object.entries(interestedIn)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const [{ data: swiped }, blockedIds] = await Promise.all([
    supabase.from("swipes").select("target_id").eq("swiper_id", profileId),
    fetchBlockedIds(profileId),
  ]);

  const swipedIds = (swiped || []).map((s) => s.target_id);
  const excludeIds = [profileId, ...swipedIds, ...blockedIds];

  let query = supabase
    .from("profiles")
    .select(`
      id, name, age, gender, introversion, bio, location_text, location_hidden, country,
      height, job, school, religion, hometown, politics, language,
      photos!inner(public_url, display_order),
      prompt_answers(prompt_text, answer, display_order)
    `)
    .eq("is_onboarded", true)
    .gte("age", ageMin)
    .lte("age", ageMax)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (genders.length > 0 && genders.length < 3) {
    query = query.in("gender", genders);
  }

  if (myCountry) {
    if (mode === "local") {
      query = query.eq("country", myCountry);
    } else if (mode === "international") {
      query = query.neq("country", myCountry);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchDiscoverFeed:", error.message);
    return [];
  }

  return (data || []).map((p) => {
    const sortedPhotos = (p.photos || [])
      .sort((a, b) => a.display_order - b.display_order)
      .map((ph) => ph.public_url);
    const sortedPrompts = (p.prompt_answers || []).sort(
      (a, b) => a.display_order - b.display_order
    );
    const rawLoc = p.location_text || "";
    const displayLocation = p.location_hidden
      ? displayCountry(p.country) || rawLoc
      : rawLoc;

    return {
      ...p,
      photos: sortedPhotos,
      prompts: sortedPrompts,
      location: displayLocation,
    };
  });
}

export async function recordSwipe(swiperId, targetId, action) {
  const { error } = await supabase.from("swipes").upsert(
    { swiper_id: swiperId, target_id: targetId, action },
    { onConflict: "swiper_id,target_id" }
  );
  if (error) console.error("recordSwipe:", error.message);
}

export async function checkMutualMatch(swiperId, targetId) {
  // Did the target also like us?
  const { data } = await supabase
    .from("swipes")
    .select("id")
    .eq("swiper_id", targetId)
    .eq("target_id", swiperId)
    .eq("action", "like")
    .maybeSingle();

  if (!data) return null;

  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: match, error } = await supabase
    .from("matches")
    .insert({
      user_a: swiperId < targetId ? swiperId : targetId,
      user_b: swiperId < targetId ? targetId : swiperId,
      status: "active",
      timer_deadline: deadline,
    })
    .select()
    .single();

  if (error) {
    console.error("checkMutualMatch:", error.message);
    return null;
  }
  return match;
}

export async function fetchActiveMatch(profileId) {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id, status, started_at, user_a, user_b, timer_deadline, last_sender_id,
      profiles_a:profiles!matches_user_a_fkey(id, name, age, gender, introversion, bio, location_text, location_hidden, country, height, job, school, religion, hometown, politics, language),
      profiles_b:profiles!matches_user_b_fkey(id, name, age, gender, introversion, bio, location_text, location_hidden, country, height, job, school, religion, hometown, politics, language)
    `)
    .eq("status", "active")
    .or(`user_a.eq.${profileId},user_b.eq.${profileId}`)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const otherProfile =
    data.user_a === profileId ? data.profiles_b : data.profiles_a;

  // Fetch other user's photos
  const { data: photos } = await supabase
    .from("photos")
    .select("public_url, display_order")
    .eq("profile_id", otherProfile.id)
    .order("display_order");

  const { data: prompts } = await supabase
    .from("prompt_answers")
    .select("prompt_text, answer, display_order")
    .eq("profile_id", otherProfile.id)
    .order("display_order");

  const rawLoc = otherProfile.location_text || "";
  const displayLocation = otherProfile.location_hidden
    ? displayCountry(otherProfile.country) || rawLoc
    : rawLoc;

  return {
    matchId: data.id,
    timerDeadline: data.timer_deadline,
    lastSenderId: data.last_sender_id,
    profile: {
      ...otherProfile,
      location: displayLocation,
      photos: (photos || []).map((p) => p.public_url),
      prompts: prompts || [],
    },
  };
}

export async function fetchMessages(matchId) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at, liked_by")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchMessages:", error.message);
    return [];
  }
  return data || [];
}

export async function sendMessage(matchId, senderId, body) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: senderId, body })
    .select()
    .single();

  if (error) {
    console.error("sendMessage:", error.message);
    return null;
  }
  return data;
}

export async function endMatch(matchId) {
  const { error } = await supabase
    .from("matches")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", matchId);

  if (error) console.error("endMatch:", error.message);
}

export async function resetMatchTimer(matchId, senderId) {
  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("matches")
    .update({ timer_deadline: deadline, last_sender_id: senderId })
    .eq("id", matchId);

  if (error) console.error("resetMatchTimer:", error.message);
  return deadline;
}

export async function savePreferences(profileId, prefs) {
  return updateProfile(profileId, { preferences: prefs });
}

export async function fetchProfileByEmail(email) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("fetchProfileByEmail:", error.message);
    return null;
  }
  if (!data) return null;

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("profile_id", data.id)
    .order("display_order");

  const { data: prompts } = await supabase
    .from("prompt_answers")
    .select("*")
    .eq("profile_id", data.id)
    .order("display_order");

  return {
    ...data,
    photos: (photos || []).map((p) => p.public_url),
    photoRows: photos || [],
    prompts: prompts || [],
  };
}

export async function sendEmailOtp(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) {
    // "Signups not allowed" means the user doesn't exist in Auth yet — use magic link signup
    const { error: retryError } = await supabase.auth.signInWithOtp({ email });
    if (retryError) {
      console.error("sendEmailOtp:", retryError.message);
      return { success: false, message: retryError.message };
    }
  }
  return { success: true };
}

export async function verifyEmailOtp(email, token) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) {
    console.error("verifyEmailOtp:", error.message);
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function linkEmail(profileId, email) {
  return updateProfile(profileId, { email });
}

export async function deleteAccount(profileId) {
  const { data: photos } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("profile_id", profileId);

  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path);
    await supabase.storage.from("photos").remove(paths);
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    console.error("deleteAccount:", error.message);
    return false;
  }
  return true;
}

export async function blockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) console.error("blockUser:", error.message);

  const { data: activeMatch } = await supabase
    .from("matches")
    .select("id")
    .eq("status", "active")
    .or(
      `and(user_a.eq.${blockerId},user_b.eq.${blockedId}),and(user_a.eq.${blockedId},user_b.eq.${blockerId})`
    )
    .maybeSingle();

  if (activeMatch) {
    await endMatch(activeMatch.id);
  }
}

export async function reportUser(reporterId, reportedId, reason, details = "") {
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: reporterId, reported_id: reportedId, reason, details });
  if (error) console.error("reportUser:", error.message);
}

export async function fetchBlockedIds(profileId) {
  const { data: asBlocker } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", profileId);

  const { data: asBlocked } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocked_id", profileId);

  const ids = [
    ...(asBlocker || []).map((r) => r.blocked_id),
    ...(asBlocked || []).map((r) => r.blocker_id),
  ];
  return [...new Set(ids)];
}

export async function markWeMet(matchId) {
  const { error } = await supabase
    .from("matches")
    .update({ we_met: true })
    .eq("id", matchId);
  if (error) console.error("markWeMet:", error.message);
}

export async function upsertPushToken(profileId, token, platform) {
  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      { profile_id: profileId, token, platform },
      { onConflict: "token" }
    );
  if (error) console.error("upsertPushToken:", error.message);
}

export async function toggleMessageLike(messageId, profileId) {
  const { data: msg } = await supabase
    .from("messages")
    .select("liked_by")
    .eq("id", messageId)
    .single();

  const newVal = msg?.liked_by === profileId ? null : profileId;
  const { error } = await supabase
    .from("messages")
    .update({ liked_by: newVal })
    .eq("id", messageId);

  if (error) console.error("toggleMessageLike:", error.message);
  return newVal;
}

export async function sendPushNotification(recipientId, title, body, data = {}) {
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("profile_id", recipientId);

  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default",
    title,
    body,
    data,
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (e) {
    console.error("sendPushNotification:", e.message);
  }
}

export async function upsertPrompt(profileId, promptText, answer, displayOrder) {
  const { data: existing } = await supabase
    .from("prompt_answers")
    .select("id")
    .eq("profile_id", profileId)
    .eq("display_order", displayOrder)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("prompt_answers")
      .update({ prompt_text: promptText, answer })
      .eq("id", existing.id);
    if (error) console.error("upsertPrompt:", error.message);
  } else {
    const { error } = await supabase
      .from("prompt_answers")
      .insert({
        profile_id: profileId,
        prompt_text: promptText,
        answer,
        display_order: displayOrder,
      });
    if (error) console.error("upsertPrompt:", error.message);
  }
}
