import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";
import type { UserProfile } from "@/types";
import { verifyCreatorPasscode } from "@/utils/benny";

const GOLD = "#F5C518";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { userProfile, setUserProfile, isCreator, unlockCreator } = useApp();

  const [name, setName] = useState(userProfile?.name || "");
  const [birthday, setBirthday] = useState(userProfile?.birthday || "");
  const [why, setWhy] = useState(userProfile?.why || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [tapCount, setTapCount] = useState(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [passcodeVisible, setPasscodeVisible] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setBirthday(userProfile.birthday || "");
      setWhy(userProfile.why || "");
    }
  }, [userProfile]);

  const save = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    const profile: UserProfile = {
      name: name.trim() || undefined,
      birthday: birthday.trim() || undefined,
      why: why.trim() || undefined,
      startDate: userProfile?.startDate || new Date().toISOString(),
    };
    await setUserProfile(profile);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBennyTap = () => {
    if (isCreator) return;

    const next = tapCount + 1;
    setTapCount(next);

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      setTapCount(0);
    }, 3000);

    if (next >= 7) {
      setTapCount(0);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      setPasscodeInput("");
      setPasscodeError("");
      setPasscodeVisible(true);
    }
  };

  const handlePasscodeSubmit = async () => {
    if (!passcodeInput.trim()) return;
    setVerifying(true);
    const result = await verifyCreatorPasscode(passcodeInput.trim());
    setVerifying(false);
    if (result.valid && result.creatorToken) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await unlockCreator(result.creatorToken);
      setPasscodeVisible(false);
      setPasscodeInput("");
      setPasscodeError("");
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPasscodeInput("");
      setPasscodeError("*narrows eyes* That's not it. Not even close. Goodbye.");
    }
  };

  const startDate = userProfile?.startDate
    ? new Date(userProfile.startDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "today";

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.pageTitle}>MY PROFILE</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isCreator && (
          <View style={styles.creatorBadge}>
            <MaterialCommunityIcons name="paw" size={20} color={GOLD} />
            <Text style={styles.creatorBadgeText}>CREATOR</Text>
            <MaterialCommunityIcons name="paw" size={20} color={GOLD} />
          </View>
        )}

        <TouchableOpacity onPress={handleBennyTap} activeOpacity={1}>
          <View style={styles.bennyNote}>
            <MaterialCommunityIcons name="dog" size={18} color={Colors.warning} />
            <Text style={styles.bennyNoteText}>
              Benny uses this information to feel like a real friend. The more you tell him, the more personal he gets.
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.startDateLabel}>
          Training since {startDate}
        </Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>YOUR NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="What should Benny call you?"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.fieldHint}>
            Benny uses this occasionally. Not every sentence, just when it lands right.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>BIRTHDAY</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g. 1995-08-14)"
            placeholderTextColor={Colors.textMuted}
            value={birthday}
            onChangeText={setBirthday}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.fieldHint}>
            On your birthday Benny goes completely unhinged. In the best way. Still makes you work out.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TELL BENNY WHY YOU'RE DOING THIS</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="What's your real motivation? Lose weight? Build confidence? Prove something to yourself? Be honest."
            placeholderTextColor={Colors.textMuted}
            value={why}
            onChangeText={setWhy}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.fieldHint}>
            Benny brings this up at exactly the right moments — when you're struggling, when you need it most. Your own words, back to you.
          </Text>
        </View>

        <View style={styles.geraldBox}>
          <MaterialCommunityIcons name="cat" size={22} color={Colors.accent + "88"} />
          <View style={{ flex: 1 }}>
            <Text style={styles.geraldTitle}>ABOUT GERALD</Text>
            <Text style={styles.geraldText}>
              Gerald is Benny's fictional nemesis — a lazy cat who gets stronger when you slack and weaker when you crush it. You'll hear about him a lot.
            </Text>
          </View>
        </View>

        <View style={styles.deadliftBox}>
          <MaterialCommunityIcons name="weight-lifter" size={22} color={Colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.deadliftTitle}>BENNY'S OPINIONS</Text>
            <Text style={styles.deadliftText}>
              Benny loves deadlifts with his entire body. He will NEVER stop bringing this up. He also has an irrational hatred of burpees that borders on personal.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: saving || pressed ? 0.7 : 1 },
          ]}
        >
          {saved
            ? <Feather name="check" size={20} color="#000" />
            : <Feather name="save" size={20} color="#000" />
          }
          <Text style={styles.saveBtnText}>
            {saving ? "SAVING..." : saved ? "SAVED!" : "SAVE PROFILE"}
          </Text>
        </Pressable>

        {isCreator && (
          <Pressable
            onPress={() => router.push("/admin")}
            style={({ pressed }) => [styles.adminBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <MaterialCommunityIcons name="paw" size={18} color={GOLD} />
            <Text style={styles.adminBtnText}>ADMIN PANEL</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal
        visible={passcodeVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasscodeVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TextInput
              style={styles.passcodeInput}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={passcodeInput}
              onChangeText={(v) => { setPasscodeInput(v); setPasscodeError(""); }}
              secureTextEntry
              autoFocus
              onSubmitEditing={handlePasscodeSubmit}
              returnKeyType="go"
            />
            {passcodeError ? (
              <Text style={styles.passcodeError}>{passcodeError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => { setPasscodeVisible(false); setPasscodeInput(""); setPasscodeError(""); }}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalSubmit, { opacity: verifying || pressed ? 0.7 : 1 }]}
                onPress={handlePasscodeSubmit}
                disabled={verifying}
              >
                <Text style={styles.modalSubmitText}>{verifying ? "..." : "ENTER"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  creatorBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 14,
    backgroundColor: GOLD + "15",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  creatorBadgeText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  bennyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.warning + "0F",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warning + "33",
    padding: 14,
    marginBottom: 16,
  },
  bennyNoteText: { flex: 1, color: Colors.warning, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  startDateLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginBottom: 20, textAlign: "center" },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 8 },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  multilineInput: { minHeight: 100 },
  fieldHint: { marginTop: 6, fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", lineHeight: 17 },
  geraldBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.accent + "0A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent + "22",
    padding: 14,
    marginBottom: 12,
  },
  geraldTitle: { fontSize: 10, color: Colors.accent + "88", fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 4 },
  geraldText: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
  deadliftBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.success + "0A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success + "22",
    padding: 14,
    marginBottom: 20,
  },
  deadliftTitle: { fontSize: 10, color: Colors.success, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 4 },
  deadliftText: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
  saveBtn: {
    backgroundColor: Colors.warning,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },
  saveBtnText: { color: "#000", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: GOLD + "88",
    borderRadius: 14,
    padding: 16,
    backgroundColor: GOLD + "0A",
    marginBottom: 4,
  },
  adminBtnText: { color: GOLD, fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "82%",
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passcodeInput: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    color: Colors.text,
    fontSize: 20,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 6,
    marginBottom: 12,
  },
  passcodeError: {
    color: Colors.accent,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  modalSubmit: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.warning,
    alignItems: "center",
  },
  modalSubmitText: {
    color: "#000",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
});
