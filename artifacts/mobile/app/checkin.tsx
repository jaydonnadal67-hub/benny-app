import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { BennyBubble } from "@/components/BennyBubble";
import { RatingRow } from "@/components/RatingRow";
import { Colors } from "@/constants/colors";
import { useAskBenny } from "@/utils/useAskBenny";
import { todayKey, sleepToCheckinRating } from "@/utils/storage";
import { sanitizeInput } from "@/utils/security";
import { buildBennyContext } from "@/utils/bennyContext";
import type { BennyMood, BennyMemory } from "@/types";

export default function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { setCheckin, history, userProfile, memories, addMemory, streak, geraldPoints, isBadDay, todaySleep } = useApp();
  const askBenny = useAskBenny();

  const prefillSleep = todaySleep ? sleepToCheckinRating(todaySleep.hoursSlept) : 3;

  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(prefillSleep);
  const [stress, setStress] = useState(3);
  const [note, setNote] = useState("");
  const [workStatus, setWorkStatus] = useState("");
  const [jobSearchUpdate, setJobSearchUpdate] = useState("");
  const [skippedReason, setSkippedReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [bennyMsg, setBennyMsg] = useState("");
  const [bennyMood, setBennyMood] = useState<BennyMood>("checkin");
  const [submitted, setSubmitted] = useState(false);

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toDateString();
  }, []);

  const missedYesterday = useMemo(() => {
    return !history.some((s) => new Date(s.date).toDateString() === yesterday);
  }, [history, yesterday]);

  const bennyCtx = buildBennyContext({
    profile: userProfile,
    memories,
    history,
    checkin: null,
    nutrition: { date: todayKey(), meals: [], water: 0 },
    streak,
    geraldPoints,
    isBadDay,
    achievements: [],
  });

  const extractMemories = async (
    jobSearch: string,
    work: string,
    generalNote: string,
  ) => {
    if (!jobSearch && !work && !generalNote) return;

    const prompt = `Based on this check-in data, identify any specific things Benny should remember and follow up on in 2-3 days:
Job search: "${jobSearch || "nothing mentioned"}"
Work: "${work || "nothing mentioned"}"
Personal note: "${generalNote || "nothing mentioned"}"

Return a JSON array (can be empty) of objects: [{"note": "brief description of what to remember", "category": "job|life|achievement|struggle|goal", "followUpDate": "ISO date string 2-3 days from now"}]
Only extract genuinely memorable, specific details. Max 2 items. Return ONLY valid JSON, no other text.`;

    try {
      const { message } = await askBenny(prompt, "greeting");
      const cleaned = message.replace(/```json\n?|\n?```/g, "").trim();
      const items = JSON.parse(cleaned) as Array<{
        note: string;
        category: string;
        followUpDate: string;
      }>;
      for (const item of items) {
        const memory: BennyMemory = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          category: item.category as BennyMemory["category"],
          note: item.note,
          followUpDate: item.followUpDate,
          followedUp: false,
        };
        await addMemory(memory);
      }
    } catch {}
  };

  const submit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    const cleanNote = sanitizeInput(note, "checkin");
    const cleanWorkStatus = sanitizeInput(workStatus, "checkin");
    const cleanJobSearch = sanitizeInput(jobSearchUpdate, "checkin");
    const cleanSkippedReason = sanitizeInput(skippedReason, "checkin");

    const excuseSection = missedYesterday && cleanSkippedReason
      ? `\n\nThey missed their workout yesterday. Their excuse: "${cleanSkippedReason}". Rate this excuse out of 10 with a sarcastic but honest assessment. "Sick? 7/10, acceptable but suspicious. Tired? 2/10. Too busy? 0/10." Be specific to their actual excuse.`
      : "";

    const prompt = `${bennyCtx}You are Benny, a sarcastic dachshund fitness coach who genuinely cares about his owner.

Today's check-in:
- Energy: ${energy}/5
- Sleep: ${sleep}/5
- Stress: ${stress}/5
- Work situation: "${cleanWorkStatus || "not mentioned"}"
- Job search: "${cleanJobSearch || "no update"}"
- Personal note: "${cleanNote || "nothing extra"}"${excuseSection}

React as Benny — sarcastic but warm. If stress is high (4-5), be softer and genuine. If they shared job/work news, acknowledge it with care. If they gave an excuse for missing yesterday, rate it and respond accordingly. 3-4 sentences. Never fully admit how much you care.`;

    const { message, mood } = await askBenny(prompt, "checkin");
    setBennyMsg(message);
    setBennyMood(mood);

    await setCheckin({
      date: todayKey(),
      energy,
      sleep,
      stress,
      note: cleanNote,
      workStatus: cleanWorkStatus,
      jobSearchUpdate: cleanJobSearch,
      skippedReason: cleanSkippedReason || undefined,
    });

    extractMemories(cleanJobSearch, cleanWorkStatus, cleanNote);

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>DAILY CHECK-IN</Text>
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
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="dog" size={36} color={Colors.warning} />
          <View>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.subtitle}>
              Benny needs to assess the full situation.
            </Text>
          </View>
        </View>

        {!submitted ? (
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>HOW'S YOUR BODY?</Text>
            <RatingRow label="Energy Level" value={energy} onChange={setEnergy} iconName="⚡" />
            <View>
              <RatingRow label="Sleep Quality" value={sleep} onChange={setSleep} iconName="🌙" />
              {todaySleep ? (
                <Text style={{ fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 4, marginLeft: 2 }}>
                  Pre-filled from sleep tracker ({todaySleep.hoursSlept}h logged)
                </Text>
              ) : null}
            </View>
            <RatingRow label="Stress Level" value={stress} onChange={setStress} iconName="🎯" />

            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>HOW'S YOUR LIFE?</Text>

            <Text style={styles.fieldLabel}>How is work going today?</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Good, bad, chaotic, boring... tell Benny."
              placeholderTextColor={Colors.textMuted}
              value={workStatus}
              onChangeText={setWorkStatus}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Any job search updates?</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Interviews? Applications? Radio silence? He wants to know."
              placeholderTextColor={Colors.textMuted}
              value={jobSearchUpdate}
              onChangeText={setJobSearchUpdate}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Anything else Benny should know?</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Optional — but Benny is listening."
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            {missedYesterday && (
              <View style={styles.excuseSection}>
                <View style={styles.excuseHeader}>
                  <MaterialCommunityIcons name="cat" size={16} color={Colors.accent + "99"} />
                  <Text style={styles.excuseTitle}>YESTERDAY'S WORKOUT WAS MISSING</Text>
                </View>
                <Text style={styles.excuseLabel}>
                  Tell Benny why you skipped (optional — but he'll rate your excuse)
                </Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="I was sick / tired / too busy / had a thing... whatever it was."
                  placeholderTextColor={Colors.textMuted}
                  value={skippedReason}
                  onChangeText={setSkippedReason}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            )}

            <Pressable
              onPress={submit}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                { opacity: loading || pressed ? 0.75 : 1 },
              ]}
            >
              <Text style={styles.submitText}>
                {loading ? "BENNY IS PROCESSING..." : "GET BENNY'S VERDICT"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <BennyBubble text={bennyMsg} mood={bennyMood} loading={loading} />
            <Pressable
              onPress={() => router.replace("/")}
              style={({ pressed }) => [styles.goBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.goBtnText}>LET'S GO</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </Pressable>
          </View>
        )}
      </ScrollView>
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
  title: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.warning + "0C",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warning + "33",
  },
  dateText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: { fontSize: 10, color: Colors.textMuted, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 14 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },
  fieldLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  fieldInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 64,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  noteInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 64,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  excuseSection: {
    backgroundColor: Colors.accent + "0A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent + "33",
    padding: 14,
    marginBottom: 20,
  },
  excuseHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  excuseTitle: { fontSize: 10, color: Colors.accent + "99", fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  excuseLabel: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 10 },
  submitBtn: { backgroundColor: Colors.warning, borderRadius: 14, padding: 16, alignItems: "center" },
  submitText: { color: "#000", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  goBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  goBtnText: { color: "#fff", fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 3 },
});
