import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";
import { useAskBenny } from "@/utils/useAskBenny";
import { GOALS } from "@/constants/workouts";
import type { BennyMood } from "@/types";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const GRADES = ["F", "D", "C", "B", "A"];

export function WeeklyReport({ visible, onClose }: Props) {
  const { history, cardio, nutrition, checkin, streak, sleepEntries } = useApp();
  const askBenny = useAskBenny();
  const [report, setReport] = useState("");
  const [grade, setGrade] = useState("?");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weekWorkouts = history.filter((s) => new Date(s.date) >= monday);
  const weekCardio = cardio.filter((s) => new Date(s.date) >= monday);
  const weekSleep = sleepEntries.filter((s) => new Date(s.date) >= monday);
  const totalVolume = weekWorkouts.reduce((a, s) => a + s.totalVolume, 0);
  const totalSets = weekWorkouts.reduce((a, s) => a + s.totalSets, 0);
  const totalCardioDuration = weekCardio.reduce((a, s) => a + s.duration, 0);
  const todayCal = nutrition.meals.reduce((a, m) => a + m.calories, 0);
  const todayProtein = nutrition.meals.reduce((a, m) => a + m.protein, 0);
  const avgSleep = weekSleep.length > 0
    ? Math.round((weekSleep.reduce((a, s) => a + s.hoursSlept, 0) / weekSleep.length) * 10) / 10
    : 0;

  const scoreWorkouts = Math.min(weekWorkouts.length / 4, 1) * 35;
  const scoreCardio = Math.min(weekCardio.length / 2, 1) * 15;
  const scoreProtein = Math.min(todayProtein / GOALS.protein, 1) * 15;
  const scoreWater = Math.min(nutrition.water / GOALS.water, 1) * 10;
  const scoreStreak = Math.min(streak / 7, 1) * 15;
  const scoreSleep = weekSleep.length > 0 ? Math.min(avgSleep / 8, 1) * 10 : 0;
  const totalScore = scoreWorkouts + scoreCardio + scoreProtein + scoreWater + scoreStreak + scoreSleep;
  const gradeIndex = Math.floor(totalScore / 20);
  const computedGrade = GRADES[Math.min(gradeIndex, 4)];

  const generate = async () => {
    setLoading(true);
    setGenerated(false);

    const sleepNote = avgSleep > 0
      ? `- Average sleep this week: ${avgSleep}h/night (${weekSleep.length} nights logged)`
      : "- Sleep: not tracked this week (Benny is disappointed)";

    const prompt = `You are Benny, a sarcastic dachshund fitness coach delivering a WEEKLY REPORT CARD. Be dramatic and formal like it's a real school report card but with tiny dog energy.

WEEK STATS:
- Workouts completed: ${weekWorkouts.length}/4 days targeted
- Total volume lifted: ${totalVolume.toLocaleString()} lbs over ${totalSets} sets  
- Cardio sessions: ${weekCardio.length} sessions, ${totalCardioDuration} total minutes
- Today's nutrition: ${todayCal}/${GOALS.calories} cal, ${todayProtein}/${GOALS.protein}g protein
- Water today: ${nutrition.water}/${GOALS.water} glasses
- Current streak: ${streak} days
${sleepNote}
- Letter grade computed: ${computedGrade}
${checkin?.jobSearchUpdate ? `- Job search this week: "${checkin.jobSearchUpdate}"` : "- Job search: no update given"}
${checkin?.workStatus ? `- Work situation: "${checkin.workStatus}"` : ""}

Write Benny's weekly report card. Include:
1. A dramatic opening like a school teacher (but a tiny dachshund)
2. Subject grades: LIFTING (based on workouts/volume), CARDIO (cardio sessions), NUTRITION (calories/protein), HYDRATION (water), CONSISTENCY (streak), SLEEP (avg hours - Benny takes this VERY seriously)
3. Comments on job search if mentioned
4. Overall letter grade: ${computedGrade}
5. One-sentence closing statement that is either devastated, reluctantly proud, or somewhere in between
Be specific with actual numbers. Channel academic formality + dachshund drama. 6-8 sentences total.`;

    const { message } = await askBenny(prompt, "checkin");
    setReport(message);
    setGrade(computedGrade);
    setLoading(false);
    setGenerated(true);
  };

  useEffect(() => {
    if (visible && !generated) {
      generate();
    }
  }, [visible]);

  const gradeColor =
    grade === "A" ? Colors.success
    : grade === "B" ? Colors.info
    : grade === "C" ? Colors.warning
    : grade === "D" ? "#FF6B35"
    : Colors.accent;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>BENNY'S WEEKLY REPORT</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gradeCard}>
            <MaterialCommunityIcons name="dog" size={40} color={Colors.warning} />
            <View>
              <Text style={styles.weekLabel}>
                Week of{" "}
                {monday.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              <Text style={styles.gradeTitle}>OVERALL GRADE</Text>
            </View>
            <View style={[styles.gradeBadge, { backgroundColor: gradeColor + "22", borderColor: gradeColor }]}>
              <Text style={[styles.gradeLetter, { color: gradeColor }]}>{grade}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {[
              { label: "WORKOUTS", value: `${weekWorkouts.length}/4`, color: Colors.accent },
              { label: "VOLUME", value: `${totalVolume > 0 ? `${Math.round(totalVolume / 1000)}k` : "—"} lbs`, color: Colors.push.accent },
              { label: "CARDIO", value: `${weekCardio.length} sess.`, color: Colors.success },
              { label: "SLEEP", value: avgSleep > 0 ? `${avgSleep}h avg` : "—", color: "#7C6AFF" },
              { label: "STREAK", value: `${streak} days`, color: Colors.warning },
            ].map((s) => (
              <View key={s.label} style={styles.statCell}>
                <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.warning} />
              <Text style={styles.loadingText}>Benny is reviewing your performance...</Text>
            </View>
          ) : (
            <View style={[styles.reportCard, { borderColor: gradeColor + "44" }]}>
              <Text style={styles.reportText}>{report}</Text>
              <Text style={[styles.reportSig, { color: Colors.warning }]}>— BENNY, CERTIFIED DACHSHUND EVALUATOR</Text>
            </View>
          )}

          <Pressable onPress={generate} style={styles.regenerateBtn}>
            <Feather name="refresh-cw" size={14} color={Colors.textMuted} />
            <Text style={styles.regenerateText}>REGENERATE REPORT</Text>
          </Pressable>

          <Pressable onPress={onClose} style={[styles.closeFullBtn, { backgroundColor: gradeColor }]}>
            <Text style={styles.closeBtnText}>GOT IT, BENNY</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  gradeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.warning + "33",
  },
  weekLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  gradeTitle: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 1 },
  gradeBadge: {
    marginLeft: "auto",
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeLetter: { fontSize: 36, fontWeight: "700", fontFamily: "Inter_700Bold", lineHeight: 42 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statCell: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statVal: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginTop: 4 },
  loadingBox: { alignItems: "center", padding: 40, gap: 14 },
  loadingText: { color: Colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  reportCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  reportText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    marginBottom: 12,
  },
  reportSig: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  regenerateText: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  closeFullBtn: { borderRadius: 14, padding: 18, alignItems: "center" },
  closeBtnText: { color: "#000", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
});
