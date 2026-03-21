import { useState, useCallback, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";
import { colors, spacing, typography, lineHeights, radius } from "../theme";
import { updateProfile, linkEmail, sendEmailOtp, verifyEmailOtp, deleteAccount, upsertPrompt } from "../lib/api";
import { clearProfileId } from "../lib/deviceId";
import { pickAndUploadPhoto, deletePhoto } from "../lib/photos";

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

const RELIGION_OPTIONS = [
  "Christian", "Catholic", "Jewish", "Muslim", "Hindu", "Buddhist",
  "Agnostic", "Atheist", "Spiritual", "Other", "Prefer not to say",
];

const POLITICS_OPTIONS = [
  "Liberal", "Moderate", "Conservative", "Not political", "Prefer not to say",
];

const HEIGHT_OPTIONS = (() => {
  const h = [];
  for (let feet = 4; feet <= 7; feet++) {
    const max = feet === 7 ? 0 : 11;
    for (let inches = 0; inches <= max; inches++) {
      h.push(`${feet}\u2032${inches}\u2033`);
    }
  }
  return h;
})();

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_GAP = spacing.xs;
const PHOTO_COLUMNS = 3;
const PHOTO_SIZE =
  (SCREEN_WIDTH - spacing.sm * 2 - PHOTO_GAP * (PHOTO_COLUMNS - 1)) / PHOTO_COLUMNS;
const MAX_PHOTOS = 6;

function ChevronRight({ size = 20, color = colors.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <SvgPath d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 28, color = colors.tealGlow }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <SvgPath d="M12 5v14M5 12h14" strokeLinecap="round" />
    </Svg>
  );
}

function PencilIcon({ size = 16, color = colors.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <SvgPath
        d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ProfileRow({ label, value, onPress, showChevron = true }) {
  return (
    <Pressable style={styles.profileRow} onPress={onPress}>
      <View style={styles.profileRowLeft}>
        <Text style={styles.profileRowLabel}>{label}</Text>
        {value ? <Text style={styles.profileRowValue}>{value}</Text> : null}
      </View>
      {showChevron && <ChevronRight />}
    </Pressable>
  );
}

function EditModal({ visible, title, value, onSave, onClose, multiline }) {
  const [text, setText] = useState(value || "");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={[styles.modalInput, multiline && styles.modalInputMultiline]}
            value={text}
            onChangeText={setText}
            autoFocus
            multiline={multiline}
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.modalButtons}>
            <Pressable style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.modalSave}
              onPress={() => {
                onSave(text.trim());
                onClose();
              }}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function OptionSelectModal({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.optionList} bounces={false}>
            {options.map((opt) => {
              const active = selected === opt;
              return (
                <Pressable key={opt} style={styles.optionRow} onPress={() => onSelect(opt)}>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt}</Text>
                  <View style={[styles.optionRadio, active && styles.optionRadioActive]}>
                    {active && <View style={styles.optionDot} />}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CheckIcon({ size = 18, color = colors.tealGlow }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <SvgPath d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

function LocationEditModal({ visible, value, hidden, onSave, onClose }) {
  const [text, setText] = useState(value || "");
  const [hide, setHide] = useState(!!hidden);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Edit Location</Text>
          <TextInput
            style={styles.modalInput}
            value={text}
            onChangeText={setText}
            autoFocus
            placeholderTextColor={colors.textMuted}
            placeholder="City, State"
          />
          <Pressable
            style={styles.locCheckboxRow}
            onPress={() => setHide((v) => !v)}
          >
            <View style={[styles.locCheckbox, hide && styles.locCheckboxChecked]}>
              {hide && <CheckIcon />}
            </View>
            <View>
              <Text style={styles.locCheckboxLabel}>Don't show on profile</Text>
              <Text style={styles.locCheckboxHint}>Only your country will be visible</Text>
            </View>
          </Pressable>
          <View style={styles.modalButtons}>
            <Pressable style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.modalSave}
              onPress={() => {
                onSave(text.trim(), hide);
                onClose();
              }}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EmailVerifyModal({ visible, currentEmail, onVerified, onClose }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(currentEmail || "");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setSending(true);
    setError("");
    const result = await sendEmailOtp(trimmed);
    setSending(false);
    if (result.success) {
      setStep("code");
    } else {
      setError(result.message || "Failed to send code");
    }
  };

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setSending(true);
    setError("");
    const result = await verifyEmailOtp(email.trim().toLowerCase(), trimmed);
    setSending(false);
    if (result.success) {
      onVerified(email.trim().toLowerCase());
    } else {
      setError(result.message || "Invalid code");
    }
  };

  const handleClose = () => {
    setStep("email");
    setCode("");
    setError("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>
            {step === "email" ? "Link Email" : "Verify Email"}
          </Text>
          {step === "email" ? (
            <>
              <Text style={styles.emailExplainer}>
                We'll send a verification code to confirm your email
              </Text>
              <TextInput
                style={styles.modalInput}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); }}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                autoFocus
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </>
          ) : (
            <>
              <Text style={styles.emailExplainer}>
                Enter the 6-digit code sent to {email.trim().toLowerCase()}
              </Text>
              <TextInput
                style={styles.modalInput}
                value={code}
                onChangeText={(t) => { setCode(t); setError(""); }}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                autoFocus
                keyboardType="number-pad"
                maxLength={6}
              />
            </>
          )}
          {error ? <Text style={styles.emailError}>{error}</Text> : null}
          <View style={styles.modalButtons}>
            {step === "code" && (
              <Pressable
                style={styles.modalCancel}
                onPress={() => { setStep("email"); setCode(""); setError(""); }}
              >
                <Text style={styles.modalCancelText}>Back</Text>
              </Pressable>
            )}
            <Pressable style={styles.modalCancel} onPress={handleClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalSave, sending && { opacity: 0.5 }]}
              onPress={step === "email" ? handleSendCode : handleVerify}
              disabled={sending}
            >
              <Text style={styles.modalSaveText}>
                {sending ? "..." : step === "email" ? "Send Code" : "Verify"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CloseIcon({ size = 24, color = colors.textPrimary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <SvgPath d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PromptPickerModal({ visible, usedPrompts, onSelect, onClose }) {
  const available = ALL_PROMPTS.filter((p) => !usedPrompts.includes(p));

  const renderItem = ({ item }) => (
    <Pressable style={styles.pickerRow} onPress={() => onSelect(item)}>
      <Text style={styles.pickerRowText}>{item}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.pickerContainer}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.pickerHeader}>
            <Pressable style={styles.pickerCloseButton} onPress={onClose}>
              <CloseIcon />
            </Pressable>
            <Text style={styles.pickerTitle}>Select a prompt</Text>
            <View style={styles.pickerCloseButton} />
          </View>
          <FlatList
            data={available}
            keyExtractor={(item) => item}
            renderItem={renderItem}
            contentContainerStyle={styles.pickerList}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function PromptEditModal({ visible, promptText, answer, onSave, onChangePrompt, onClose }) {
  const [ans, setAns] = useState(answer || "");

  useEffect(() => {
    setAns(answer || "");
  }, [answer, promptText]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Pressable style={styles.promptEditHeader} onPress={onChangePrompt}>
            <Text style={styles.modalTitle}>{promptText}</Text>
            <PencilIcon size={14} color={colors.tealGlow} />
          </Pressable>
          <TextInput
            style={[styles.modalInput, styles.modalInputMultiline]}
            value={ans}
            onChangeText={setAns}
            placeholder="Your answer"
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus
          />
          <View style={styles.modalButtons}>
            <Pressable style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.modalSave}
              onPress={() => {
                if (ans.trim()) {
                  onSave(promptText, ans.trim());
                  onClose();
                }
              }}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function MeScreen({ profile, onUpdateProfile, onLogout }) {
  const [editField, setEditField] = useState(null);
  const [editPromptIndex, setEditPromptIndex] = useState(null);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [uploading, setUploading] = useState(false);

  const genderDisplay =
    profile.gender === "Man"
      ? "Man"
      : profile.gender === "Woman"
      ? "Woman"
      : "Nonbinary";

  const introversionDisplay = profile.introversion || "Introvert";
  const prompts = profile.prompts || [];
  const photos = profile.photos || [];
  const promptSlots = 3;

  const handlePhotoPress = useCallback(
    async (index) => {
      if (photos[index]) {
        Alert.alert("Photo", "What would you like to do?", [
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deletePhoto(profile.id, index);
              const updated = [...photos];
              updated.splice(index, 1);
              onUpdateProfile({ photos: updated });
            },
          },
          { text: "Cancel", style: "cancel" },
        ]);
      } else {
        setUploading(true);
        const url = await pickAndUploadPhoto(profile.id, photos.length);
        setUploading(false);
        if (url) {
          onUpdateProfile({ photos: [...photos, url] });
        }
      }
    },
    [photos, profile.id, onUpdateProfile]
  );

  const handleSaveField = useCallback(
    async (field, value) => {
      await updateProfile(profile.id, { [field]: value });
      onUpdateProfile({ [field]: value });
    },
    [profile.id, onUpdateProfile]
  );

  const handleEmailVerified = useCallback(
    async (email) => {
      await linkEmail(profile.id, email);
      onUpdateProfile({ email });
      setEditField(null);
    },
    [profile.id, onUpdateProfile]
  );

  const handleSavePrompt = useCallback(
    async (index, promptText, answer) => {
      await upsertPrompt(profile.id, promptText, answer, index);
      const updated = [...prompts];
      updated[index] = { prompt_text: promptText, answer, display_order: index };
      onUpdateProfile({ prompts: updated });
    },
    [profile.id, prompts, onUpdateProfile]
  );

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your profile and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAccount(profile.id);
            await clearProfileId();
            onLogout?.();
          },
        },
      ]
    );
  }, [profile.id, onLogout]);

  const handleLogout = useCallback(async () => {
    await clearProfileId();
    onLogout?.();
  }, [onLogout]);

  const photoSlots = [];
  for (let i = 0; i < MAX_PHOTOS; i++) {
    photoSlots.push(photos[i] || null);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.emailBanner}
            onPress={() => setEditField("email")}
          >
            <Text style={styles.emailLabel}>Email</Text>
            <Text style={styles.emailValue}>{profile.email || "Not linked"}</Text>
            <ChevronRight />
          </Pressable>

          <Text style={styles.screenTitle}>My Profile</Text>

          <View style={styles.photoGrid}>
            {photoSlots.map((photo, i) => (
              <Pressable
                key={i}
                style={styles.photoSlot}
                onPress={() => handlePhotoPress(i)}
                disabled={uploading}
              >
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                ) : (
                  <View style={styles.photoEmpty}>
                    <PlusIcon />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
          <Text style={styles.photoHint}>
            {uploading ? "Uploading..." : "Tap + to add photos"}
          </Text>

          <View style={styles.section}>
            <SectionHeader title="About Me" />
            <Pressable
              style={styles.bioCard}
              onPress={() => setEditField("bio")}
            >
              {profile.bio ? (
                <View style={styles.bioContent}>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                  <PencilIcon />
                </View>
              ) : (
                <View style={styles.bioEmpty}>
                  <PlusIcon size={22} />
                  <Text style={styles.bioPlaceholder}>Write something about yourself...</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.section}>
            <SectionHeader title="My Answers" />
            {prompts.map((p, i) => (
              <Pressable
                key={i}
                style={styles.promptCard}
                onPress={() => {
                  setEditPromptIndex(i);
                  setPendingPrompt({
                    text: p.prompt_text,
                    answer: p.answer,
                  });
                }}
              >
                <View style={styles.promptHeader}>
                  <Text style={styles.promptText}>{p.prompt_text}</Text>
                  <PencilIcon />
                </View>
                <Text style={styles.promptAnswer}>{p.answer}</Text>
              </Pressable>
            ))}
            {Array.from({ length: Math.max(0, promptSlots - prompts.length) }).map((_, i) => (
              <Pressable
                key={`empty-${i}`}
                style={styles.promptCardEmpty}
                onPress={() => {
                  setEditPromptIndex(prompts.length + i);
                  setShowPromptPicker(true);
                }}
              >
                <PlusIcon size={24} />
                <Text style={styles.promptAddText}>Add a prompt</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Profile Details" />
            <View style={styles.detailsCard}>
              <ProfileRow
                label="Name"
                value={profile.name}
                onPress={() => setEditField("name")}
              />
              <View style={styles.divider} />
              <ProfileRow label="Age" value={String(profile.age)} showChevron={false} />
              <View style={styles.divider} />
              <ProfileRow label="Gender" value={genderDisplay} showChevron={false} />
              <View style={styles.divider} />
              <ProfileRow label="Introversion" value={introversionDisplay} showChevron={false} />
              <View style={styles.divider} />
              <ProfileRow
                label="Location"
                value={profile.location_text || "Not set"}
                onPress={() => setEditField("location_text")}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="About Me" />
            <View style={styles.detailsCard}>
              <ProfileRow
                label="Height"
                value={profile.height || "Not set"}
                onPress={() => setEditField("height")}
              />
              <View style={styles.divider} />
              <ProfileRow
                label="Job"
                value={profile.job || "Not set"}
                onPress={() => setEditField("job")}
              />
              <View style={styles.divider} />
              <ProfileRow
                label="School"
                value={profile.school || "Not set"}
                onPress={() => setEditField("school")}
              />
              <View style={styles.divider} />
              <ProfileRow
                label="Religion"
                value={profile.religion || "Not set"}
                onPress={() => setEditField("religion")}
              />
              <View style={styles.divider} />
              <ProfileRow
                label="Politics"
                value={profile.politics || "Not set"}
                onPress={() => setEditField("politics")}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Account" />
            <View style={styles.detailsCard}>
              <Pressable style={styles.profileRow} onPress={handleLogout}>
                <Text style={styles.actionLabel}>Log out</Text>
                <ChevronRight />
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.profileRow} onPress={handleDeleteAccount}>
                <Text style={styles.dangerLabel}>Delete account</Text>
                <ChevronRight color="rgba(255,80,80,0.6)" />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Legal" />
            <View style={styles.detailsCard}>
              <Pressable style={styles.profileRow} onPress={() => Linking.openURL("https://oneatatime.dating/terms")}>
                <Text style={styles.actionLabel}>Terms of Service</Text>
                <ChevronRight />
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.profileRow} onPress={() => Linking.openURL("https://oneatatime.dating/privacy")}>
                <Text style={styles.actionLabel}>Privacy Policy</Text>
                <ChevronRight />
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.profileRow} onPress={() => Linking.openURL("https://oneatatime.dating/guidelines")}>
                <Text style={styles.actionLabel}>Community Guidelines</Text>
                <ChevronRight />
              </Pressable>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {editField === "bio" && (
        <EditModal
          visible
          title="Edit Bio"
          value={profile.bio}
          multiline
          onSave={(val) => handleSaveField("bio", val)}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === "name" && (
        <EditModal
          visible
          title="Edit Name"
          value={profile.name}
          onSave={(val) => handleSaveField("name", val)}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === "location_text" && (
        <LocationEditModal
          visible
          value={profile.location_text}
          hidden={profile.location_hidden}
          onSave={async (val, hide) => {
            await updateProfile(profile.id, {
              location_text: val,
              location_hidden: hide,
            });
            onUpdateProfile({ location_text: val, location_hidden: hide });
          }}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === "email" && (
        <EmailVerifyModal
          visible
          currentEmail={profile.email}
          onVerified={handleEmailVerified}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === "job" && (
        <EditModal
          visible
          title="Edit Job"
          value={profile.job}
          onSave={(val) => handleSaveField("job", val)}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === "school" && (
        <EditModal
          visible
          title="Edit School"
          value={profile.school}
          onSave={(val) => handleSaveField("school", val)}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === "height" && (
        <OptionSelectModal
          visible
          title="Edit Height"
          options={HEIGHT_OPTIONS}
          selected={profile.height}
          onSelect={(val) => { handleSaveField("height", val); setEditField(null); }}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === "religion" && (
        <OptionSelectModal
          visible
          title="Edit Religion"
          options={RELIGION_OPTIONS}
          selected={profile.religion}
          onSelect={(val) => { handleSaveField("religion", val); setEditField(null); }}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === "politics" && (
        <OptionSelectModal
          visible
          title="Edit Politics"
          options={POLITICS_OPTIONS}
          selected={profile.politics}
          onSelect={(val) => { handleSaveField("politics", val); setEditField(null); }}
          onClose={() => setEditField(null)}
        />
      )}
      <PromptPickerModal
        visible={showPromptPicker && !pendingPrompt}
        usedPrompts={prompts
          .filter((_, i) => i !== editPromptIndex)
          .map((p) => p.prompt_text)}
        onSelect={(promptText) => {
          setShowPromptPicker(false);
          setPendingPrompt({
            text: promptText,
            answer: "",
          });
        }}
        onClose={() => {
          setShowPromptPicker(false);
          setEditPromptIndex(null);
        }}
      />
      <PromptPickerModal
        visible={showPromptPicker && !!pendingPrompt}
        usedPrompts={prompts
          .filter((_, i) => i !== editPromptIndex)
          .map((p) => p.prompt_text)}
        onSelect={(promptText) => {
          setShowPromptPicker(false);
          setPendingPrompt({
            text: promptText,
            answer: "",
          });
        }}
        onClose={() => {
          setShowPromptPicker(false);
        }}
      />
      {pendingPrompt && editPromptIndex !== null && !showPromptPicker && (
        <PromptEditModal
          visible
          promptText={pendingPrompt.text}
          answer={pendingPrompt.answer}
          onChangePrompt={() => {
            setShowPromptPicker(true);
          }}
          onSave={(pt, ans) => {
            handleSavePrompt(editPromptIndex, pt, ans);
            setPendingPrompt(null);
            setEditPromptIndex(null);
          }}
          onClose={() => {
            setPendingPrompt(null);
            setEditPromptIndex(null);
          }}
        />
      )}
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
  scroll: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  emailBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  emailLabel: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emailValue: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: "right",
  },
  screenTitle: {
    fontSize: typography.title,
    lineHeight: lineHeights.title,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PHOTO_GAP,
  },
  photoSlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.25,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoEmpty: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.oceanDeep,
    borderWidth: 1.5,
    borderColor: colors.tealGlow,
    borderStyle: "dashed",
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  photoHint: {
    fontSize: typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    lineHeight: lineHeights.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  bioCard: {
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  bioContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  bioText: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
  },
  bioEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bioPlaceholder: {
    fontSize: typography.body,
    color: colors.textMuted,
  },

  promptCard: {
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  promptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxs,
  },
  promptText: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  promptAnswer: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
  },
  promptCardEmpty: {
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.tealGlow,
    borderStyle: "dashed",
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  promptAddText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.tealGlow,
  },

  detailsCard: {
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  profileRowLeft: {
    flex: 1,
    gap: spacing.xxs,
  },
  profileRowLabel: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  profileRowValue: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  actionLabel: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  dangerLabel: {
    fontSize: typography.body,
    fontWeight: "600",
    color: "rgba(255,80,80,0.85)",
  },

  bottomSpacer: {
    height: spacing.hero,
  },

  optionList: {
    maxHeight: 320,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLabel: {
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  optionLabelActive: {
    color: colors.tealGlow,
    fontWeight: "700",
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  optionRadioActive: {
    borderColor: colors.tealGlow,
    backgroundColor: colors.tealGlow,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.oceanAbyss,
  },

  pickerContainer: {
    flex: 1,
    backgroundColor: colors.oceanAbyss,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerCloseButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerTitle: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  pickerList: {
    paddingHorizontal: spacing.sm,
  },
  pickerRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerRowText: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textPrimary,
  },

  promptEditHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  emailExplainer: {
    fontSize: typography.bodySmall,
    lineHeight: lineHeights.bodySmall,
    color: colors.textMuted,
  },
  emailError: {
    fontSize: typography.bodySmall,
    color: "rgba(255,80,80,0.85)",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.oceanDeep,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalInput: {
    backgroundColor: colors.oceanMid,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  modalInputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  modalCancel: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  modalCancelText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textMuted,
  },
  modalSave: {
    backgroundColor: colors.tealGlow,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  modalSaveText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.oceanAbyss,
  },
  locCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  locCheckbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.oceanDeep,
    justifyContent: "center",
    alignItems: "center",
  },
  locCheckboxChecked: {
    borderColor: colors.tealGlow,
    backgroundColor: "rgba(0,212,170,0.15)",
  },
  locCheckboxLabel: {
    fontSize: typography.bodySmall,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  locCheckboxHint: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
