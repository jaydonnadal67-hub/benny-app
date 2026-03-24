import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Share,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { ExerciseCard } from "@/components/ExerciseCard";
import { BennyBubble } from "@/components/BennyBubble";
import { RestTimer } from "@/components/RestTimer";
import { Colors } from "@/constants/colors";
import { WORKOUTS, DAY_THEMES } from "@/constants/workouts";
import { useAskBenny } from "@/utils/useAskBenny";
import { buildBennyContext } from "@/utils/bennyContext";
import { sanitizeInput } from "@/utils/security";
import { deriveMuscleGroups, formatMuscleGroups } from "@/utils/muscleGroups";
import type { WorkoutDay } from "@/constants/workouts";
import type { SetEntry, ExerciseSets, BennyMood } from "@/types";

type DayTheme = "push" | "pull" | "legs" | "upper";

const THEME_ACCENTS: Record<DayTheme, string> = {
  push: Colors.push.accent,
  pull: Colors.pull.accent,
  legs: Colors.legs.accent,
  upper: Colors.upper.accent,
};
const THEME_BG: Record<DayTheme, string> = {
  push: Colors.push.bg,
  pull: Colors.pull.bg,
  legs: Colors.legs.bg,
  upper: Colors.upper.bg,
};
const THEME_CARD: Record<DayTheme, string> = {
  push: Colors.push.card,
  pull: Colors.pull.card,
  legs: Colors.legs.card,
  upper: Colors.upper.card,
};

const UNSOLICITED_ADVICE = [
  "Did you know grip width affects lat activation? Anyway I once ate an entire sock. Focus on your next set.",
  "Breathing: exhale on exertion. I know you knew that. I'm saying it anyway because I can.",
  "Fun fact: progressive overload is literally the only thing that matters. Also I'm small but mighty. Unrelated.",
  "Your mind-muscle connection is either helping or it isn't. Squeeze the thing you're trying to work. Revolutionary concept.",
  "Gerald has been doing nothing all day. I'm just noting that. The contrast is striking.",
  "Time under tension > ego lifting > doing nothing > whatever you were about to do instead of the next set.",
  "Hydration reminder. You're going to ignore this. I'm writing it down so I can say I told you.",
  "Every rep you don't do, Gerald does. Think about that. Don't actually think about it too long. Pick up the weight.",
  "Your form on that last set was... let's call it a journey. We'll work on it.",
  "I dreamed about deadlifts last night. This has nothing to do with your rest timer. Go do your next set.",
];

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { day: dayParam, isCustom } = useLocalSearchParams<{ day: string; isCustom?: string }>();
  const { addSession, checkin, customWorkouts, userProfile, memories, streak, geraldPoints, isBadDay, history } = useApp();
  const askBenny = useAskBenny();

  const day = dayParam || "Day 1 — Push";

  const customWorkout = isCustom === "true"
    ? customWorkouts.find((w) => w.id === day)
    : null;
  const exercises = customWorkout
    ? customWorkout.exercises
    : (WORKOUTS[day as WorkoutDay] || []);

  const themeKey = customWorkout?.theme || (DAY_THEMES[day as WorkoutDay] || "push") as DayTheme;
  const accent = themeKey in THEME_ACCENTS ? THEME_ACCENTS[themeKey as DayTheme] : Colors.purple;
  const bgColor = themeKey in THEME_BG ? THEME_BG[themeKey as DayTheme] : Colors.bg;
  const cardBg = themeKey in THEME_CARD ? THEME_CARD[themeKey as DayTheme] : Colors.bgCard;

  const [showPreWorkout, setShowPreWorkout] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [prediction, setPrediction] = useState("");
  const [preLoading, setPreLoading] = useState(true);

  const [sets, setSets] = useState<ExerciseSets>(() => {
    const s: ExerciseSets = {};
    exercises.forEach((ex) => { s[ex] = [{ weight: "", reps: "", rpe: "" }]; });
    return s;
  });

  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bennyMsg, setBennyMsg] = useState("");
  const [bennyMood, setBennyMood] = useState<BennyMood>("neutral");
  const [showReaction, setShowReaction] = useState(false);
  const [stats, setStats] = useState({ sets: 0, volume: 0, rpe: "" });
  const [exerciseBennyLines, setExerciseBennyLines] = useState<Record<string, string>>({});
  const [exerciseBennyLoading, setExerciseBennyLoading] = useState<Record<string, boolean>>({});
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [timerBennyMsg, setTimerBennyMsg] = useState("");
  const [unsolicitedAdvice, setUnsolicitedAdvice] = useState("");

  const bennyCtx = buildBennyContext({
    profile: userProfile,
    memories,
    history,
    checkin,
    nutrition: { date: "", meals: [], water: 0 },
    streak,
    geraldPoints,
    isBadDay,
    achievements: [],
  });

  useEffect(() => {
    const generate = async () => {
      setPreLoading(true);
      const displayName = customWorkout?.name || day;
      const exerciseList = exercises.join(", ");
      const hasDead = exercises.some((e) => e.toLowerCase().includes("deadlift"));

      const namePrompt = `${bennyCtx}Generate a single dramatic workout session name for: ${displayName} (exercises: ${exerciseList}). Examples: "Operation Chest Destruction", "The Pull Reckoning", "Leg Day 4: This Time It's Personal", "The Gerald Destroyer". ${hasDead ? "Benny is very excited — deadlifts are involved." : ""} ${checkin?.jobSearchUpdate ? `User context: ${checkin.jobSearchUpdate}` : ""}. Return ONLY the session name, nothing else.`;

      const predictionPrompt = `${bennyCtx}You are Benny making a pre-workout prediction. ONE specific sentence about how this workout will go based on:
Energy: ${checkin?.energy || "?"}/5, Sleep: ${checkin?.sleep || "?"}/5, Stress: ${checkin?.stress || "?"}/5.
Exercises: ${exerciseList}.
Example: "Energy at 2/5 and you've got squats — I'm giving you 55% odds of hitting your numbers. Prove me wrong." Be specific with the actual exercises and stats.`;

      const [nameRes, predRes] = await Promise.all([
        askBenny(namePrompt, "workout"),
        askBenny(predictionPrompt, "workout"),
      ]);

      setSessionName(nameRes.message.replace(/["']/g, "").trim());
      setPrediction(predRes.message);
      setPreLoading(false);
    };
    generate();
  }, []);

  const updateSets = (ex: string, newSets: SetEntry[]) => {
    setSets((prev) => ({ ...prev, [ex]: newSets }));
  };

  const handleSetComplete = async (exercise: string, completedSet: SetEntry) => {
    if (!completedSet.weight || !completedSet.reps) return;
    setShowRestTimer(true);

    const shouldGiveAdvice = Math.random() < 0.35;
    if (shouldGiveAdvice) {
      const advicePool = [...UNSOLICITED_ADVICE];
      setUnsolicitedAdvice(advicePool[Math.floor(Math.random() * advicePool.length)]);
    }

    setExerciseBennyLoading((prev) => ({ ...prev, [exercise]: true }));
    const vol = (parseFloat(completedSet.weight) || 0) * (parseFloat(completedSet.reps) || 0);
    const prompt = `${bennyCtx}You are Benny, tiny sarcastic dachshund gym coach. ONE short sentence reacting to: ${completedSet.weight}lbs × ${completedSet.reps} reps on ${exercise}${completedSet.rpe ? ` @RPE ${completedSet.rpe}` : ""}. Volume: ${vol}lbs. ${exercise.toLowerCase().includes("deadlift") ? "Benny is VERY EXCITED about this. Deadlifts." : exercise.toLowerCase().includes("burpee") ? "Benny is personally victimized that burpees are happening." : ""} Be funny. No intro. Just the reaction.`;
    const { message } = await askBenny(prompt, "workout");
    setExerciseBennyLines((prev) => ({ ...prev, [exercise]: message }));
    setExerciseBennyLoading((prev) => ({ ...prev, [exercise]: false }));
  };

  const saveWorkout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSaving(true);
    setShowRestTimer(false);
    const cleanNotes = sanitizeInput(notes, "note");

    const totalSets = Object.values(sets).reduce(
      (a, s) => a + s.filter((x) => x.weight && x.reps).length, 0,
    );
    const totalVol = Object.values(sets).reduce(
      (a, s) => a + s.reduce((b, x) => b + (parseFloat(x.weight) || 0) * (parseFloat(x.reps) || 0), 0), 0,
    );
    const rpeVals = Object.values(sets).flat().map((s) => parseFloat(s.rpe)).filter(Boolean);
    const avgRpe = rpeVals.length
      ? (rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length).toFixed(1)
      : "";

    const exerciseSummary = Object.entries(sets).map(([ex, s]) => {
      const logged = s.filter((x) => x.weight && x.reps);
      return logged.length ? `${ex}: ${logged.map((x) => `${x.weight}lbs×${x.reps}${x.rpe ? ` @RPE${x.rpe}` : ""}`).join(", ")}` : null;
    }).filter(Boolean).join("\n");

    const expectedSets = exercises.length * 3;
    const displayName = customWorkout?.name || day;

    const prompt = `${bennyCtx}You are Benny, a sarcastic dachshund personal trainer.
Session: "${sessionName}" (${displayName})
${exerciseSummary || "Barely anything logged..."}
Sets: ${totalSets}/${expectedSets} expected. Volume: ${totalVol.toLocaleString()}lbs. Avg RPE: ${avgRpe || "not recorded"}. Notes: "${cleanNotes || "none"}".
Your prediction was: "${prediction}"
React as Benny. Reference actual numbers. Did your prediction hold? Was he right or wrong? Crushed it = zoomies. Slacked = dramatic flop. 3-4 sentences.`;

    const { message, mood } = await askBenny(prompt, "workout");
    setBennyMsg(message);
    setBennyMood(mood);

    const completedExercises = Object.entries(sets)
      .filter(([, s]) => s.some((x) => x.weight && x.reps))
      .map(([ex]) => ex);
    const muscleGroups = deriveMuscleGroups(completedExercises.length > 0 ? completedExercises : exercises);

    const session = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      day: customWorkout?.name || day,
      date: new Date().toISOString(),
      exercises: sets,
      notes: cleanNotes,
      bennyQuote: message.slice(0, 150),
      totalVolume: totalVol,
      totalSets,
      muscleGroups,
    };

    await addSession(session);
    setStats({ sets: totalSets, volume: totalVol, rpe: avgRpe });
    setSaved(true);
    setSaving(false);
    setShowReaction(true);
  };

  const shareVerdict = async () => {
    const statsText = [
      stats.sets > 0 ? `${stats.sets} sets` : null,
      stats.volume > 0 ? `${stats.volume.toLocaleString()} lbs volume` : null,
      stats.rpe ? `avg RPE ${stats.rpe}` : null,
    ].filter(Boolean).join(" · ");
    const displayName = customWorkout?.name || day;
    const text = `LiftLog — "${sessionName}"\n${displayName}\n\n${statsText}\n\nBenny's Verdict:\n"${bennyMsg}"\n— BENNY THE DACHSHUND`;
    try {
      await Share.share({ message: text, title: "Benny's Verdict" });
    } catch {}
  };

  if (showReaction) {
    const isGood = bennyMood === "good";
    return (
      <View style={[styles.reactionScreen, { backgroundColor: isGood ? Colors.legs.bg : Colors.push.bg }]}>
        <View style={[styles.reactionContent, {
          paddingTop: isWeb ? 67 : insets.top + 20,
          paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20,
        }]}>
          <Text style={[styles.sessionNameVerdict, { color: accent }]}>
            "{sessionName}"
          </Text>
          <Text style={[styles.verdictLabel, { color: isGood ? Colors.success : Colors.accent }]}>BENNY'S VERDICT</Text>
          <BennyBubble text={bennyMsg} mood={bennyMood} />
          <View style={styles.reactionStats}>
            {[
              { label: "SETS", value: stats.sets.toString() },
              { label: "VOLUME", value: stats.volume > 0 ? `${stats.volume.toLocaleString()}lbs` : "—" },
              { label: "AVG RPE", value: stats.rpe || "—" },
            ].map((s) => (
              <View key={s.label} style={styles.reactionStat}>
                <Text style={[styles.reactionStatVal, { color: isGood ? Colors.success : Colors.accent }]}>{s.value}</Text>
                <Text style={styles.reactionStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={shareVerdict} style={[styles.shareBtn, { borderColor: accent + "66" }]}>
            <Feather name="share-2" size={16} color={Colors.textSecondary} />
            <Text style={styles.shareBtnText}>SHARE BENNY'S VERDICT</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/")} style={[styles.homeBtn, { backgroundColor: isGood ? Colors.success : Colors.accent }]}>
            <Text style={styles.homeBtnText}>BACK TO HOME</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (showPreWorkout) {
    return (
      <View style={[styles.preWorkoutScreen, { paddingTop: isWeb ? 67 : insets.top + 20, paddingBottom: isWeb ? 34 : insets.bottom }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { position: "absolute", top: isWeb ? 67 : insets.top + 8, left: 20 }]}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>

        {preLoading ? (
          <View style={styles.preLoadingContent}>
            <MaterialCommunityIcons name="dog" size={52} color={Colors.warning} />
            <ActivityIndicator color={Colors.warning} size="large" style={{ marginTop: 20 }} />
            <Text style={styles.preLoadingText}>Benny is naming your session...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.preContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.preSessionLabel, { color: accent + "99" }]}>TODAY'S SESSION</Text>
            <Text style={[styles.preSessionName, { color: accent }]}>"{sessionName}"</Text>
            <Text style={styles.preDay}>{customWorkout?.name || day}</Text>

            <View style={[styles.predictionCard, { borderColor: Colors.warning + "44" }]}>
              <MaterialCommunityIcons name="dog" size={18} color={Colors.warning} />
              <Text style={styles.predictionLabel}>BENNY'S PREDICTION</Text>
              <Text style={styles.predictionText}>{prediction}</Text>
            </View>

            <View style={styles.exercisePreview}>
              <Text style={styles.exercisePreviewLabel}>TODAY'S EXERCISES</Text>
              {exercises.map((ex, i) => (
                <Text key={ex} style={styles.exercisePreviewItem}>
                  {i + 1}. {ex}
                </Text>
              ))}
            </View>

            <Pressable
              onPress={() => setShowPreWorkout(false)}
              style={[styles.beginBtn, { backgroundColor: accent }]}
            >
              <Text style={styles.beginBtnText}>BEGIN SESSION</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </Pressable>
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: bgColor }]}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={[styles.dayTitle, { color: accent }]}>{sessionName || (customWorkout?.name || day)}</Text>
          <Text style={styles.topBarDate}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </Text>
          {deriveMuscleGroups(exercises).length > 0 && (
            <Text style={[styles.muscleGroupsText, { color: accent + "99" }]}>
              {formatMuscleGroups(deriveMuscleGroups(exercises))}
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showRestTimer && (
          <RestTimer
            onDismiss={() => { setShowRestTimer(false); setUnsolicitedAdvice(""); }}
            onBennyImpatient={(msg) => {
              setTimerBennyMsg(msg);
              setShowRestTimer(false);
              setUnsolicitedAdvice("");
            }}
          />
        )}

        {unsolicitedAdvice && showRestTimer && (
          <View style={styles.unsolicitedCard}>
            <MaterialCommunityIcons name="dog-side" size={14} color={Colors.info} />
            <Text style={styles.unsolicitedText}>{unsolicitedAdvice}</Text>
          </View>
        )}

        {timerBennyMsg ? (
          <View style={styles.timerBenny}>
            <Text style={styles.timerBennyText}>{timerBennyMsg}</Text>
            <Pressable onPress={() => setTimerBennyMsg("")} hitSlop={8}>
              <Feather name="x" size={12} color={Colors.warning + "88"} />
            </Pressable>
          </View>
        ) : null}

        {exercises.map((ex) => (
          <ExerciseCard
            key={ex}
            exercise={ex}
            sets={sets[ex] || []}
            onSetsChange={(s) => updateSets(ex, s)}
            onAddSet={(lastSet) => handleSetComplete(ex, lastSet)}
            accent={accent}
            cardBg={cardBg}
            bennyLine={exerciseBennyLines[ex]}
            bennyLoading={exerciseBennyLoading[ex]}
          />
        ))}

        <TextInput
          style={styles.notesInput}
          placeholder="Session notes (how you felt, PRs, etc...)"
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Pressable
          onPress={saveWorkout}
          disabled={saving || saved}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: saved ? Colors.success : accent, opacity: saving || pressed ? 0.8 : 1 },
          ]}
        >
          {saved
            ? <Feather name="check" size={20} color="#fff" />
            : <Feather name="save" size={20} color={accent === Colors.push.accent ? "#fff" : "#000"} />
          }
          <Text style={[styles.saveBtnText, { color: saved ? "#fff" : accent === Colors.push.accent ? "#fff" : "#000" }]}>
            {saving ? "SAVING..." : saved ? "SAVED!" : "SAVE WORKOUT"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  preWorkoutScreen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  preLoadingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  preLoadingText: { color: Colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8 },
  preContent: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  preSessionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 3, marginBottom: 8, textAlign: "center" },
  preSessionName: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center", lineHeight: 32, marginBottom: 6 },
  preDay: { fontSize: 13, color: Colors.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 24 },
  predictionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 6,
  },
  predictionLabel: { fontSize: 10, color: Colors.warning, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  predictionText: { color: Colors.text, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, fontStyle: "italic" },
  exercisePreview: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 24,
  },
  exercisePreviewLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 10 },
  exercisePreviewItem: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", paddingVertical: 3 },
  beginBtn: {
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  beginBtnText: { color: "#fff", fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 3 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  topBarCenter: { alignItems: "center", flex: 1 },
  dayTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 0.5, textAlign: "center" },
  topBarDate: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  muscleGroupsText: { fontSize: 10, fontFamily: "Inter_600SemiBold", marginTop: 3, letterSpacing: 0.5, textAlign: "center" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  unsolicitedCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.info + "0A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.info + "33",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  unsolicitedText: { flex: 1, fontSize: 12, color: Colors.info, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  timerBenny: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.warning + "12",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warning + "33",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  timerBennyText: { flex: 1, fontSize: 12, color: Colors.warning, fontFamily: "Inter_400Regular", fontStyle: "italic", marginRight: 8 },
  notesInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    marginTop: 4,
    marginBottom: 14,
    textAlignVertical: "top",
  },
  saveBtn: {
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  saveBtnText: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  reactionScreen: { flex: 1 },
  reactionContent: { flex: 1, paddingHorizontal: 20, justifyContent: "center" },
  sessionNameVerdict: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },
  verdictLabel: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 20,
  },
  reactionStats: { flexDirection: "row", gap: 10, marginBottom: 16, marginTop: 4 },
  reactionStat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  reactionStatVal: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  reactionStatLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  shareBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  homeBtn: { borderRadius: 14, padding: 18, alignItems: "center" },
  homeBtnText: { color: "#fff", fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 3 },
});
