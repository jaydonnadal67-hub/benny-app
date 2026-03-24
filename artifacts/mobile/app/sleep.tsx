import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { BennyBubble } from "@/components/BennyBubble";
import { Colors } from "@/constants/colors";
import { useAskBenny } from "@/utils/useAskBenny";
import { todayKey, calcHoursSlept } from "@/utils/storage";
import type { BennyMood, SleepEntry } from "@/types";

const SLEEP_COLOR = "#7C6AFF";

const BEDTIMES = [
  { label: "8 PM", value: "20:00" },
  { label: "9 PM", value: "21:00" },
  { label: "9:30", value: "21:30" },
  { label: "10 PM", value: "22:00" },
  { label: "10:30", value: "22:30" },
  { label: "11 PM", value: "23:00" },
  { label: "11:30", value: "23:30" },
  { label: "12 AM", value: "00:00" },
  { label: "12:30", value: "00:30" },
  { label: "1 AM", value: "01:00" },
  { label: "1:30", value: "01:30" },
  { label: "2 AM", value: "02:00" },
];

const WAKETIMES = [
  { label: "4 AM", value: "04:00" },
  { label: "4:30", value: "04:30" },
  { label: "5 AM", value: "05:00" },
  { label: "5:30", value: "05:30" },
  { label: "6 AM", value: "06:00" },
  { label: "6:30", value: "06:30" },
  { label: "7 AM", value: "07:00" },
  { label: "7:30", value: "07:30" },
  { label: "8 AM", value: "08:00" },
  { label: "8:30", value: "08:30" },
  { label: "9 AM", value: "09:00" },
  { label: "10 AM", value: "10:00" },
];

function hoursColor(h: number): string {
  if (h < 6) return Colors.accent;
  if (h < 7) return Colors.warning;
  if (h < 8) return Colors.info;
  return Colors.success;
}

function formatHours(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { addSleepEntry, todaySleep, sleepEntries } = useApp();
  const askBenny = useAskBenny();

  const [bedtime, setBedtime] = useState(todaySleep?.bedtime ?? "22:00");
  const [wakeTime, setWakeTime] = useState(todaySleep?.wakeTime ?? "07:00");
  const [loading, setLoading] = useState(false);
  const [bennyMsg, setBennyMsg] = useState(todaySleep?.bennyReaction ?? "");
  const [bennyMood, setBennyMood] = useState<BennyMood>("neutral");
  const [saved, setSaved] = useState(!!todaySleep);

  const hoursSlept = calcHoursSlept(bedtime, wakeTime);
  const hColor = hoursColor(hoursSlept);

  const recentEntries = sleepEntries.slice(0, 7);
  const avgSleep =
    recentEntries.length > 0
      ? recentEntries.reduce((a, s) => a + s.hoursSlept, 0) / recentEntries.length
      : 0;

  useEffect(() => {
    if (todaySleep && !bennyMsg) {
      setBennyMsg(todaySleep.bennyReaction ?? "");
    }
  }, [todaySleep]);

  const save = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    let reaction = "";
    let mood: BennyMood = "neutral";

    if (hoursSlept < 6) {
      const prompt = `You are Benny, a dachshund fitness coach who is OBSESSED with sleep and naps. The user only slept ${hoursSlept} hours. This is a personal emergency for you. Express genuine panic and concern — not just sarcasm. You believe sleep is sacred. Reference your own napping schedule (you napped 6 hours today alone). Reference your love of couch naps and sunbeam naps. Be warm but genuinely alarmed. 2-3 sentences.`;
      const r = await askBenny(prompt, "checkin");
      reaction = r.message;
      mood = "bad";
    } else if (hoursSlept < 7) {
      const prompt = `You are Benny, a dachshund who loves sleep more than anything. The user slept ${hoursSlept} hours. This is... acceptable. But you want better for them. Reference that you personally require at least 14 hours of sleep daily (naps included). Express reluctant acceptance but make it clear you expect improvement. 2-3 sentences.`;
      const r = await askBenny(prompt, "checkin");
      reaction = r.message;
      mood = "neutral";
    } else if (hoursSlept < 8) {
      const prompt = `You are Benny, a sleep-obsessed dachshund. The user slept ${hoursSlept} hours. You are grudgingly pleased. This is not perfect but it is good. Reference napping as the natural companion to a solid night of sleep. You are reluctantly approving. 2-3 sentences.`;
      const r = await askBenny(prompt, "checkin");
      reaction = r.message;
      mood = "good";
    } else {
      const prompt = `You are Benny, a dachshund who considers sleep to be the most sacred thing in existence. The user slept ${hoursSlept} hours. You are SO PROUD you can barely contain yourself. Reference your own napping schedule and how much you respect a fellow creature who takes rest seriously. Reference a specific nap location you love (couch, under a blanket, in a sunbeam). Get genuinely emotional about this. 2-3 sentences.`;
      const r = await askBenny(prompt, "checkin");
      reaction = r.message;
      mood = "good";
    }

    const entry: SleepEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: todayKey(),
      bedtime,
      wakeTime,
      hoursSlept,
      bennyReaction: reaction,
    };

    await addSleepEntry(entry);
    setBennyMsg(reaction);
    setBennyMood(mood);
    setLoading(false);
    setSaved(true);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>SLEEP TRACKER</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: isWeb ? 60 : insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hoursCard, { borderColor: hColor + "55" }]}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={32} color={SLEEP_COLOR} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hoursLabel}>TONIGHT'S SLEEP</Text>
            <Text style={[styles.hoursValue, { color: hColor }]}>
              {formatHours(hoursSlept)}
            </Text>
          </View>
          {avgSleep > 0 && (
            <View style={styles.avgBox}>
              <Text style={styles.avgLabel}>7-DAY AVG</Text>
              <Text style={[styles.avgValue, { color: hoursColor(avgSleep) }]}>
                {formatHours(avgSleep)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BEDTIME</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {BEDTIMES.map((t) => {
                const selected = bedtime === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBedtime(t.value); setSaved(false); }}
                    style={[styles.chip, selected && { backgroundColor: SLEEP_COLOR, borderColor: SLEEP_COLOR }]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WAKE TIME</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {WAKETIMES.map((t) => {
                const selected = wakeTime === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWakeTime(t.value); setSaved(false); }}
                    style={[styles.chip, selected && { backgroundColor: SLEEP_COLOR, borderColor: SLEEP_COLOR }]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {saved && bennyMsg ? (
          <View style={styles.bennySection}>
            <BennyBubble text={bennyMsg} mood={bennyMood} loading={false} />
            <Pressable
              onPress={() => { setSaved(false); }}
              style={styles.updateBtn}
            >
              <Feather name="edit-2" size={14} color={Colors.textMuted} />
              <Text style={styles.updateBtnText}>UPDATE SLEEP</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={save}
            disabled={loading}
            style={({ pressed }) => [styles.saveBtn, { backgroundColor: SLEEP_COLOR, opacity: loading || pressed ? 0.75 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="moon-waning-crescent" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>LOG SLEEP & GET BENNY'S VERDICT</Text>
              </>
            )}
          </Pressable>
        )}

        {recentEntries.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>SLEEP HISTORY</Text>
            {recentEntries.map((entry) => {
              const date = new Date(entry.date);
              const isToday = entry.date === todayKey();
              const dayLabel = isToday
                ? "Today"
                : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              const c = hoursColor(entry.hoursSlept);
              return (
                <View key={entry.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{dayLabel}</Text>
                  <Text style={styles.historyBedtime}>
                    {formatDisplayTime(entry.bedtime)} — {formatDisplayTime(entry.wakeTime)}
                  </Text>
                  <Text style={[styles.historyHours, { color: c }]}>
                    {formatHours(entry.hoursSlept)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatDisplayTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
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
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  hoursCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
  },
  hoursLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  hoursValue: { fontSize: 36, fontWeight: "700", fontFamily: "Inter_700Bold", lineHeight: 42 },
  avgBox: { alignItems: "flex-end" },
  avgLabel: { fontSize: 9, color: Colors.textMuted, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  avgValue: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  section: { gap: 10 },
  sectionLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  chipScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  chipRow: { flexDirection: "row", gap: 8, paddingRight: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  chipTextSelected: { color: "#fff", fontFamily: "Inter_700Bold" },
  bennySection: { gap: 10 },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  updateBtnText: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  saveBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  historySection: { gap: 10, marginTop: 4 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyDate: { width: 70, fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_600SemiBold" },
  historyBedtime: { flex: 1, fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  historyHours: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
