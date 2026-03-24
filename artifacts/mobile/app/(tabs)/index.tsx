import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { BennyBubble } from "@/components/BennyBubble";
import { BennyMoodCard } from "@/components/BennyMoodCard";
import { StatCard } from "@/components/StatCard";
import { WeeklyReport } from "@/components/WeeklyReport";
import { Colors } from "@/constants/colors";
import { WORKOUTS, DAY_THEMES, GOALS } from "@/constants/workouts";
import { useAskBenny } from "@/utils/useAskBenny";
import { buildBennyContext } from "@/utils/bennyContext";
import {
  todayKey,
  wasWeeklyReportShownThisWeek,
  markWeeklyReportShown,
} from "@/utils/storage";
import type { WorkoutDay } from "@/constants/workouts";
import type { BennyMood } from "@/types";

type DayTheme = "push" | "pull" | "legs" | "upper";

const DAY_ACCENT: Record<DayTheme, string> = {
  push: Colors.push.accent,
  pull: Colors.pull.accent,
  legs: Colors.legs.accent,
  upper: Colors.upper.accent,
};

const DAY_BG: Record<DayTheme, string> = {
  push: Colors.push.card,
  pull: Colors.pull.card,
  legs: Colors.legs.card,
  upper: Colors.upper.card,
};

const CUSTOM_ACCENT = Colors.purple;

const WORKOUT_DAYS = Object.keys(WORKOUTS) as WorkoutDay[];

const GREETING_STYLES = [
  "Sarcastic but secretly proud. Reference the specific day of week with a complaint.",
  "Formal British butler tone (still a dachshund). Announce the user's arrival dramatically.",
  "Sports commentator narrating the user opening the app.",
  "Tiny dog panic mode — something urgent and silly happened.",
  "Suspicious interrogation — Benny is monitoring suspicious activity (user's laziness).",
  "Weather report, but about the user's fitness situation.",
  "Dramatic movie trailer narration about today's workout.",
  "CEO of a tiny gym giving a status update.",
  "News anchor breaking story: user opened fitness app.",
  "Text from 'The Dachshund' — cryptic short message, cryptic tone.",
  "Motivational speaker who is also a dachshund who has given up somewhat.",
  "Ancient wise sensei dachshund dispensing wisdom.",
  "Dramatic opera-singer Benny, brief but theatrical.",
  "Passive-aggressive reminder note left on the counter.",
  "Life coach Benny who is simultaneously proud and exhausted.",
  "Unimpressed film critic reviewing user's recent gym attendance.",
  "Overly enthusiastic puppy version of Benny who forgot to be sarcastic.",
  "Benny sending a voice memo. Describe what he'd say in that memo.",
  "Benny writing in his tiny dog diary, disappointed but hopeful.",
  "Secret spy dossier entry — codename: user, current status: sweaty or lazy.",
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const {
    history, nutrition, checkin, weights, streak, bennyMoodState, isLoaded,
    userProfile, memories, geraldPoints, isBadDay, customWorkouts, achievements,
    todaySleep,
  } = useApp();
  const askBenny = useAskBenny();
  const today = todayKey();

  const [bennyMsg, setBennyMsg] = useState("");
  const [bennyMood, setBennyMood] = useState<BennyMood>("neutral");
  const [loadingBenny, setLoadingBenny] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [sundayPromptDone, setSundayPromptDone] = useState(false);
  const [showPepTalkModal, setShowPepTalkModal] = useState(false);
  const [pepTalkMsg, setPepTalkMsg] = useState("");
  const [pepTalkLoading, setPepTalkLoading] = useState(false);

  const todayCalories = nutrition.meals.reduce((a, m) => a + (m.calories || 0), 0);
  const todayProtein = nutrition.meals.reduce((a, m) => a + (m.protein || 0), 0);
  const weekSessions = history.filter(
    (h) => new Date(h.date) > new Date(Date.now() - 7 * 86400000),
  ).length;

  const latestWeight = weights.length
    ? [...weights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;
  const weightDaysSince = latestWeight
    ? Math.floor((Date.now() - new Date(latestWeight.date).getTime()) / 86400000)
    : -1;

  const geraldStatusText =
    geraldPoints > 4 ? "DOMINATING — your slack is his strength"
    : geraldPoints > 1 ? "Gaining ground on you"
    : geraldPoints < -4 ? "COMPLETELY DEFEATED"
    : geraldPoints < -1 ? "Losing badly"
    : "Watching and waiting";

  const geraldColor =
    geraldPoints > 2 ? Colors.accent
    : geraldPoints < -2 ? Colors.success
    : Colors.warning;

  const bennyCtx = buildBennyContext({
    profile: userProfile,
    memories,
    history,
    checkin,
    nutrition,
    streak,
    geraldPoints,
    isBadDay,
    achievements: achievements.map((a) => a.id),
  });

  useEffect(() => {
    if (!isLoaded || sundayPromptDone) return;
    const isSunday = new Date().getDay() === 0;
    if (isSunday) {
      wasWeeklyReportShownThisWeek().then((shown) => {
        if (!shown) {
          setSundayPromptDone(true);
          setTimeout(() => setShowWeeklyReport(true), 1200);
        }
      });
    }
  }, [isLoaded, sundayPromptDone]);

  const handleWeeklyReportClose = async () => {
    setShowWeeklyReport(false);
    await markWeeklyReportShown();
  };

  const loadGreeting = useCallback(async () => {
    setLoadingBenny(true);
    const hour = new Date().getHours();
    const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const isSunday = new Date().getDay() === 0;
    const greetingStyle = GREETING_STYLES[Math.floor(Math.random() * GREETING_STYLES.length)];

    const jobBit = checkin?.jobSearchUpdate ? ` Job search update: "${checkin.jobSearchUpdate}".` : "";
    const workBit = checkin?.workStatus ? ` Work situation: "${checkin.workStatus}".` : "";
    const weightBit = latestWeight
      ? weightDaysSince === 0 ? ` Weighed in today at ${latestWeight.weight} lbs.`
        : weightDaysSince > 2 ? ` No weight logged in ${weightDaysSince} days — Benny is personally offended.`
        : ` Last weight: ${latestWeight.weight} lbs.`
      : "";
    const proteinBit = todayProtein > 0 ? ` Protein today: ${todayProtein}g / ${GOALS.protein}g goal.` : "";
    const streakBit = streak > 0 ? ` Workout streak: ${streak} day${streak !== 1 ? "s" : ""}.` : " No active streak.";
    const sundayBit = isSunday ? " It's Sunday — Benny is reflective (and judgy)." : "";
    const whyBit = userProfile?.why ? ` This user is training because: "${userProfile.why}".` : "";

    const prompt = `${bennyCtx}You are Benny, a sarcastic dachshund fitness coach. Home screen greeting.
Style: ${greetingStyle}
Context: Hour ${hour} on ${dayName}. ${weekSessions} workouts this week. ${todayCalories} calories. ${streakBit}${weightBit}${proteinBit}${sundayBit}${whyBit}
${checkin ? `Check-in: energy ${checkin.energy}/5, sleep ${checkin.sleep}/5, stress ${checkin.stress}/5.${workBit}${jobBit}` : "No check-in today."}
Gerald is currently: ${geraldStatusText}.
1-2 sentences. Completely unique every time. Never say 'hey'.`;

    const { message, mood } = await askBenny(prompt, "greeting");
    setBennyMsg(message);
    setBennyMood(mood);
    setLoadingBenny(false);
  }, [weekSessions, todayCalories, todayProtein, streak, checkin, latestWeight, weightDaysSince, bennyCtx, geraldStatusText, userProfile]);

  useEffect(() => {
    if (isLoaded && !bennyMsg) loadGreeting();
  }, [isLoaded]);

  const requestPepTalk = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPepTalkModal(true);
    setPepTalkLoading(true);

    const highStress = checkin?.stress && checkin.stress >= 4;
    const prompt = `${bennyCtx}You are Benny, a sarcastic dachshund who just got the "I need a pep talk" tap from his person.
This is sacred. Drop the sarcasm for most of this. Be GENUINELY PERSONALIZED based on:
- Job search: "${checkin?.jobSearchUpdate || "uncertain"}"
- Their why: "${userProfile?.why || "unknown"}"
- Stress: ${checkin?.stress || "?"}/5, Energy: ${checkin?.energy || "?"}/5
- Streak: ${streak} days
- Workouts this week: ${weekSessions}
- ${highStress ? "They've had high stress lately." : ""}
Write a genuinely moving, personalized motivational speech. Reference their actual situation. Make them feel seen. Then end with something heartfelt immediately followed by ONE terrible dog joke that breaks the tension. Make it feel real.`;

    const { message } = await askBenny(prompt, "checkin");
    setPepTalkMsg(message);
    setPepTalkLoading(false);
  };

  const startWorkout = async (day: WorkoutDay) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/workout", params: { day } });
  };

  const startCustomWorkout = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/workout", params: { day: id, isCustom: "true" } });
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <WeeklyReport visible={showWeeklyReport} onClose={handleWeeklyReportClose} />

      <Modal visible={showPepTalkModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.pepTalkModal}>
          <View style={styles.pepTalkHeader}>
            <Text style={styles.pepTalkTitle}>PEP TALK</Text>
            <Pressable onPress={() => { setShowPepTalkModal(false); setPepTalkMsg(""); }} style={styles.pepTalkClose}>
              <Feather name="x" size={22} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.pepTalkScroll} contentContainerStyle={styles.pepTalkContent}>
            <MaterialCommunityIcons name="dog" size={52} color={Colors.warning} style={{ alignSelf: "center", marginBottom: 20 }} />
            {pepTalkLoading ? (
              <View style={styles.pepTalkLoading}>
                <ActivityIndicator color={Colors.warning} size="large" />
                <Text style={styles.pepTalkLoadingText}>Benny is digging deep...</Text>
              </View>
            ) : (
              <Text style={styles.pepTalkText}>{pepTalkMsg}</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: isWeb ? 67 + 12 : insets.top + 12,
            paddingBottom: isWeb ? 34 + 80 : insets.bottom + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingBenny} onRefresh={loadGreeting} tintColor={Colors.accent} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              LIFT<Text style={styles.logoAccent}>LOG</Text>
            </Text>
            <Text style={styles.tagline}>YOUR CUT & LEAN PLAN</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerIcons}>
              <Pressable onPress={() => router.push("/profile")} style={styles.iconBtn}>
                <Feather name="user" size={18} color={Colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => router.push("/achievements")} style={styles.iconBtn}>
                <MaterialCommunityIcons name="trophy-outline" size={18} color={Colors.textSecondary} />
                {achievements.length > 0 && (
                  <View style={styles.badgeDot}>
                    <Text style={styles.badgeDotText}>{achievements.length}</Text>
                  </View>
                )}
              </Pressable>
            </View>
            <Text style={[styles.calories, { color: todayCalories > GOALS.calories ? Colors.accent : Colors.warning }]}>
              {todayCalories} / {GOALS.calories} cal
            </Text>
          </View>
        </View>

        <BennyMoodCard
          mood={bennyMoodState}
          streak={streak}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            loadGreeting();
          }}
        />

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            loadGreeting();
          }}
          style={styles.bennyCard}
        >
          <BennyBubble text={bennyMsg} mood={bennyMood} loading={loadingBenny} />
          <Text style={styles.tapRefresh}>tap to refresh</Text>
        </Pressable>

        <Pressable onPress={requestPepTalk} style={styles.pepTalkBtn}>
          <MaterialCommunityIcons name="dog-side" size={16} color="#000" />
          <Text style={styles.pepTalkBtnText}>I NEED A PEP TALK</Text>
        </Pressable>

        <View style={[styles.geraldCard, { borderColor: geraldColor + "44" }]}>
          <MaterialCommunityIcons name="cat" size={18} color={geraldColor} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.geraldLabel, { color: geraldColor }]}>GERALD STATUS</Text>
            <Text style={styles.geraldStatus}>{geraldStatusText}</Text>
          </View>
          <Text style={[styles.geraldPoints, { color: geraldColor }]}>
            {geraldPoints > 0 ? `+${geraldPoints}` : geraldPoints}
          </Text>
        </View>

        {!checkin && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/checkin");
            }}
            style={styles.checkinBanner}
          >
            <MaterialCommunityIcons name="dog" size={20} color={Colors.warning} />
            <Text style={styles.checkinText}>Benny needs your daily check-in</Text>
            <Feather name="chevron-right" size={16} color={Colors.warning} />
          </Pressable>
        )}

        <View style={styles.statsRow}>
          <StatCard label="TOTAL SESSIONS" value={history.length} />
          <StatCard label="THIS WEEK" value={weekSessions} color={Colors.success} />
          <StatCard label="TODAY CAL" value={todayCalories} color={Colors.warning} />
        </View>

        <Text style={styles.sectionTitle}>SELECT WORKOUT</Text>

        {WORKOUT_DAYS.map((day) => {
          const theme = DAY_THEMES[day] as DayTheme;
          const accent = DAY_ACCENT[theme];
          const cardBg = DAY_BG[theme];
          const exCount = WORKOUTS[day].length;
          const lastSession = [...history].reverse().find((h) => h.day === day);
          const customOverride = customWorkouts.find((c) => c.name === day && c.isBuiltIn);

          return (
            <Pressable
              key={day}
              onPress={() => startWorkout(day)}
              style={({ pressed }) => [styles.workoutCard, { backgroundColor: cardBg, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.accentBar, { backgroundColor: accent }]} />
              <View style={styles.workoutCardContent}>
                <View style={styles.workoutCardLeft}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <Text style={styles.dayMeta}>
                    {customOverride ? `${customOverride.exercises.length} exercises (modified)` : `${exCount} exercises`}
                    {lastSession ? ` · Last: ${new Date(lastSession.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                  </Text>
                </View>
                <Feather name="chevron-right" size={22} color={accent} />
              </View>
            </Pressable>
          );
        })}

        {customWorkouts.filter((w) => !w.isBuiltIn).map((cw) => {
          const lastSession = [...history].reverse().find((h) => h.day === cw.name);
          return (
            <Pressable
              key={cw.id}
              onPress={() => startCustomWorkout(cw.id)}
              style={({ pressed }) => [styles.workoutCard, { backgroundColor: Colors.purple + "15", opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.accentBar, { backgroundColor: Colors.purple }]} />
              <View style={styles.workoutCardContent}>
                <View style={styles.workoutCardLeft}>
                  <View style={styles.customBadgeRow}>
                    <Text style={styles.dayLabel}>{cw.name}</Text>
                    <View style={styles.customTag}>
                      <Text style={styles.customTagText}>CUSTOM</Text>
                    </View>
                  </View>
                  <Text style={styles.dayMeta}>
                    {cw.exercises.length} exercises
                    {lastSession ? ` · Last: ${new Date(lastSession.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                  </Text>
                </View>
                <Feather name="chevron-right" size={22} color={Colors.purple} />
              </View>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/benny-workout");
          }}
          style={styles.bennyBuildCard}
        >
          <View style={styles.bennyBuildLeft}>
            <MaterialCommunityIcons name="dog" size={20} color={Colors.warning} />
            <View>
              <Text style={styles.bennyBuildTitle}>BUILD ME A WORKOUT</Text>
              <Text style={styles.bennyBuildSub}>Benny designs it, you survive it</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.warning} />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/workout-builder");
          }}
          style={styles.builderBtn}
        >
          <Feather name="plus" size={14} color={Colors.purple} />
          <Text style={[styles.builderBtnText, { color: Colors.purple }]}>BUILD CUSTOM WORKOUT</Text>
        </Pressable>

        <View style={styles.bottomButtons}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/nutrition"); }} style={[styles.bottomBtn, { borderColor: Colors.purple + "66", backgroundColor: Colors.purple + "15" }]}>
            <Feather name="pie-chart" size={18} color={Colors.purple} />
            <Text style={[styles.bottomBtnText, { color: Colors.purple }]}>NUTRITION</Text>
          </Pressable>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/cardio"); }} style={[styles.bottomBtn, { borderColor: Colors.success + "66", backgroundColor: Colors.success + "12" }]}>
            <MaterialCommunityIcons name="run" size={18} color={Colors.success} />
            <Text style={[styles.bottomBtnText, { color: Colors.success }]}>CARDIO</Text>
          </Pressable>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/history"); }} style={[styles.bottomBtn, { borderColor: Colors.border, backgroundColor: "rgba(255,255,255,0.04)" }]}>
            <Feather name="calendar" size={18} color={Colors.textSecondary} />
            <Text style={[styles.bottomBtnText, { color: Colors.textSecondary }]}>HISTORY</Text>
          </Pressable>
        </View>

        <View style={styles.secondaryButtons}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/bodyweight"); }} style={[styles.secondaryBtn, { borderColor: Colors.info + "55", backgroundColor: Colors.info + "10" }]}>
            <MaterialCommunityIcons name="scale-bathroom" size={16} color={Colors.info} />
            <Text style={[styles.secondaryBtnText, { color: Colors.info }]}>
              WEIGHT{latestWeight ? ` · ${latestWeight.weight} lbs` : ""}
            </Text>
          </Pressable>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/sleep"); }} style={[styles.secondaryBtn, { borderColor: "#7C6AFF55", backgroundColor: "#7C6AFF10" }]}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={16} color="#7C6AFF" />
            <Text style={[styles.secondaryBtnText, { color: "#7C6AFF" }]}>
              SLEEP{todaySleep ? ` · ${todaySleep.hoursSlept}h` : ""}
            </Text>
          </Pressable>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowWeeklyReport(true); }} style={[styles.secondaryBtn, { borderColor: Colors.warning + "55", backgroundColor: Colors.warning + "10" }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={Colors.warning} />
            <Text style={[styles.secondaryBtnText, { color: Colors.warning }]}>WEEKLY REPORT</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/checkin"); }}
          style={styles.checkinBtn}
        >
          <MaterialCommunityIcons name="dog" size={14} color={Colors.warning + "99"} />
          <Text style={styles.checkinBtnText}>
            {checkin ? "REDO CHECK-IN" : "DAILY CHECK-IN"}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20 },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 },
  logo: { fontSize: 42, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2, lineHeight: 44 },
  logoAccent: { color: Colors.accent },
  tagline: { fontSize: 10, color: Colors.textMuted, letterSpacing: 2, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerIcons: { flexDirection: "row", gap: 8, marginBottom: 4 },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bgCard, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  badgeDot: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDotText: { fontSize: 9, color: "#fff", fontFamily: "Inter_700Bold" },
  calories: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 2 },
  bennyCard: {
    backgroundColor: Colors.warning + "0A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.warning + "33",
  },
  tapRefresh: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: -4 },
  pepTalkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.warning,
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
  },
  pepTalkBtnText: { color: "#000", fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  geraldCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  geraldLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  geraldStatus: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 1 },
  geraldPoints: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  checkinBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.warning + "12",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning + "44",
  },
  checkinText: { flex: 1, color: Colors.warning, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  sectionTitle: { fontSize: 11, color: Colors.textMuted, letterSpacing: 2, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  workoutCard: {
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
  },
  accentBar: { width: 4 },
  workoutCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  workoutCardLeft: { flex: 1 },
  customBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayLabel: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 0.5 },
  customTag: { backgroundColor: Colors.purple + "33", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  customTagText: { fontSize: 8, color: Colors.purple, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  dayMeta: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 3 },
  bennyBuildCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.warning + "12",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warning + "44",
    padding: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  bennyBuildLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bennyBuildTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  bennyBuildSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.warning + "88",
    marginTop: 1,
  },
  builderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.purple + "55",
    marginBottom: 16,
    marginTop: 4,
  },
  builderBtnText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  bottomButtons: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 10 },
  bottomBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  bottomBtnText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  secondaryButtons: { flexDirection: "row", gap: 10, marginBottom: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  checkinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + "22",
  },
  checkinBtnText: { fontSize: 12, color: Colors.warning + "99", fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  pepTalkModal: { flex: 1, backgroundColor: Colors.bg },
  pepTalkHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pepTalkTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.warning, letterSpacing: 3 },
  pepTalkClose: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  pepTalkScroll: { flex: 1 },
  pepTalkContent: { padding: 24 },
  pepTalkLoading: { alignItems: "center", paddingTop: 40, gap: 16 },
  pepTalkLoadingText: { color: Colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 },
  pepTalkText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 28,
  },
});
