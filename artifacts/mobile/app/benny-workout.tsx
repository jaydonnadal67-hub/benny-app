import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { ExerciseCard } from "@/components/ExerciseCard";
import { BennyBubble } from "@/components/BennyBubble";
import { RestTimer } from "@/components/RestTimer";
import { Colors } from "@/constants/colors";
import { useAskBenny } from "@/utils/useAskBenny";
import { buildBennyContext } from "@/utils/bennyContext";
import { sanitizeInput } from "@/utils/security";
import { generateBennyWorkout, substituteExercise } from "@/utils/benny";
import type { SetEntry, ExerciseSets, BennyMood } from "@/types";
import type { GeneratedExercise, GeneratedWorkout } from "@/utils/benny";

const QUICK_CHIPS = [
  "Upper body",
  "Legs",
  "Full body",
  "Chest and shoulders",
  "Back and biceps",
  "Core",
  "Surprise me",
  "Quick 20 min",
];

type Phase = "prompt" | "generating" | "workout" | "reaction";

export default function BennyWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { addSession, checkin, userProfile, memories, streak, geraldPoints, isBadDay, history, creatorToken } = useApp();
  const askBenny = useAskBenny();

  const [phase, setPhase] = useState<Phase>("prompt");
  const [promptText, setPromptText] = useState("");
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [generateError, setGenerateError] = useState("");

  const [sets, setSets] = useState<ExerciseSets>({});
  const [exerciseList, setExerciseList] = useState<GeneratedExercise[]>([]);
  const [notes, setNotes] = useState("");
  const [bennyMsg, setBennyMsg] = useState("");
  const [bennyMood, setBennyMood] = useState<BennyMood>("neutral");
  const [exerciseBennyLines, setExerciseBennyLines] = useState<Record<string, string>>({});
  const [exerciseBennyLoading, setExerciseBennyLoading] = useState<Record<string, boolean>>({});
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [timerBennyMsg, setTimerBennyMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ sets: 0, volume: 0, rpe: "" });

  const [substituteModal, setSubstituteModal] = useState(false);
  const [substituteTarget, setSubstituteTarget] = useState<GeneratedExercise | null>(null);
  const [substituteReason, setSubstituteReason] = useState("");
  const [substituteLoading, setSubstituteLoading] = useState(false);
  const [substituteError, setSubstituteError] = useState("");

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

  const buildRecentHistoryContext = useCallback(() => {
    const recent = [...history]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    if (!recent.length) return undefined;
    return recent
      .map((s) => {
        const exNames = Object.keys(s.exercises).join(", ");
        const dateStr = new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        return `${dateStr}: ${s.day} (${exNames})`;
      })
      .join("; ");
  }, [history]);

  const handleGenerate = async () => {
    const clean = sanitizeInput(promptText.trim(), "note");
    if (!clean) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("generating");
    setGenerateError("");

    const recentHistory = buildRecentHistoryContext();
    const workout = await generateBennyWorkout(clean, recentHistory, creatorToken || undefined);

    if (!workout) {
      setGenerateError("Benny couldn't build your workout. He might be napping. Try again.");
      setPhase("prompt");
      return;
    }

    const initialSets: ExerciseSets = {};
    workout.exercises.forEach((ex) => {
      initialSets[ex.name] = [{ weight: "", reps: "", rpe: "" }];
    });

    setGeneratedWorkout(workout);
    setExerciseList(workout.exercises);
    setSets(initialSets);
    setPhase("workout");
  };

  const handleChip = (chip: string) => {
    setPromptText(chip);
    Haptics.selectionAsync();
  };

  const updateSets = (ex: string, newSets: SetEntry[]) => {
    setSets((prev) => ({ ...prev, [ex]: newSets }));
  };

  const handleSetComplete = async (exercise: string, completedSet: SetEntry) => {
    if (!completedSet.weight || !completedSet.reps) return;
    setShowRestTimer(true);
    setExerciseBennyLoading((prev) => ({ ...prev, [exercise]: true }));
    const vol = (parseFloat(completedSet.weight) || 0) * (parseFloat(completedSet.reps) || 0);
    const prompt = `${bennyCtx}You are Benny, tiny sarcastic dachshund gym coach. ONE short sentence reacting to: ${completedSet.weight}lbs × ${completedSet.reps} reps on ${exercise}${completedSet.rpe ? ` @RPE ${completedSet.rpe}` : ""}. Volume: ${vol}lbs. ${exercise.toLowerCase().includes("deadlift") ? "Benny is VERY EXCITED about this. Deadlifts." : exercise.toLowerCase().includes("burpee") ? "Benny is personally victimized that burpees are happening." : ""} Be funny. No intro. Just the reaction.`;
    const { message } = await askBenny(prompt, "workout");
    setExerciseBennyLines((prev) => ({ ...prev, [exercise]: message }));
    setExerciseBennyLoading((prev) => ({ ...prev, [exercise]: false }));
  };

  const openSubstituteModal = (exercise: GeneratedExercise) => {
    setSubstituteTarget(exercise);
    setSubstituteReason("");
    setSubstituteError("");
    setSubstituteModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubstitute = async () => {
    if (!substituteTarget || !substituteReason.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubstituteLoading(true);
    setSubstituteError("");

    const workoutContext = exerciseList.map((e) => e.name).join(", ");
    const sub = await substituteExercise(
      substituteTarget.name,
      substituteReason.trim(),
      workoutContext,
      creatorToken || undefined,
    );

    if (!sub) {
      setSubstituteLoading(false);
      setSubstituteError("Benny got distracted by a squirrel. Tap 'Swap It Out' to try again.");
      return;
    }

    const oldName = substituteTarget.name;
    const newExercise = sub;

    setExerciseList((prev) =>
      prev.map((e) => (e.name === oldName ? newExercise : e)),
    );

    setSets((prev) => {
      const updated: ExerciseSets = {};
      Object.entries(prev).forEach(([key, val]) => {
        if (key === oldName) {
          updated[newExercise.name] = [{ weight: "", reps: "", rpe: "" }];
        } else {
          updated[key] = val;
        }
      });
      return updated;
    });

    setExerciseBennyLines((prev) => {
      const updated = { ...prev };
      delete updated[oldName];
      updated[newExercise.name] = newExercise.bennyComment;
      return updated;
    });

    if (generatedWorkout) {
      setGeneratedWorkout((prev) =>
        prev
          ? {
              ...prev,
              exercises: prev.exercises.map((e) => (e.name === oldName ? newExercise : e)),
            }
          : prev,
      );
    }

    setSubstituteLoading(false);
    setSubstituteModal(false);
  };

  const saveWorkout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSaving(true);
    setShowRestTimer(false);
    const cleanNotes = sanitizeInput(notes, "note");

    const totalSets = Object.values(sets).reduce(
      (a, s) => a + s.filter((x) => x.weight && x.reps).length,
      0,
    );
    const totalVol = Object.values(sets).reduce(
      (a, s) =>
        a + s.reduce((b, x) => b + (parseFloat(x.weight) || 0) * (parseFloat(x.reps) || 0), 0),
      0,
    );
    const rpeVals = Object.values(sets)
      .flat()
      .map((s) => parseFloat(s.rpe))
      .filter(Boolean);
    const avgRpe = rpeVals.length
      ? (rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length).toFixed(1)
      : "";

    const exerciseSummary = Object.entries(sets)
      .map(([ex, s]) => {
        const logged = s.filter((x) => x.weight && x.reps);
        return logged.length
          ? `${ex}: ${logged.map((x) => `${x.weight}lbs×${x.reps}${x.rpe ? ` @RPE${x.rpe}` : ""}`).join(", ")}`
          : null;
      })
      .filter(Boolean)
      .join("\n");

    const workoutName = generatedWorkout?.name || "Benny's Custom Workout";

    const prompt = `${bennyCtx}You are Benny, a sarcastic dachshund personal trainer.
Session: "${workoutName}" (Benny-generated workout)
${exerciseSummary || "Not much logged..."}
Sets: ${totalSets}. Volume: ${totalVol.toLocaleString()}lbs. Avg RPE: ${avgRpe || "not recorded"}. Notes: "${cleanNotes || "none"}".
This was a Benny-designed workout — he has opinions about how it went. React as Benny. Reference actual numbers. Crushed it = zoomies. Slacked = dramatic flop. 3-4 sentences.`;

    const { message, mood } = await askBenny(prompt, "workout");
    setBennyMsg(message);
    setBennyMood(mood);

    const session = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      day: `Benny: ${workoutName}`,
      date: new Date().toISOString(),
      exercises: sets,
      notes: cleanNotes,
      bennyQuote: message.slice(0, 150),
      totalVolume: totalVol,
      totalSets,
    };

    await addSession(session);
    setStats({ sets: totalSets, volume: totalVol, rpe: avgRpe });
    setSaving(false);
    setPhase("reaction");
  };

  if (phase === "reaction") {
    const isGood = bennyMood === "good";
    return (
      <View
        style={[
          styles.reactionScreen,
          { backgroundColor: isGood ? Colors.legs.bg : Colors.push.bg },
        ]}
      >
        <View
          style={[
            styles.reactionContent,
            {
              paddingTop: isWeb ? 67 : insets.top + 20,
              paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20,
            },
          ]}
        >
          <Text style={[styles.sessionNameVerdict, { color: Colors.warning }]}>
            "{generatedWorkout?.name}"
          </Text>
          <Text
            style={[
              styles.verdictLabel,
              { color: isGood ? Colors.success : Colors.accent },
            ]}
          >
            BENNY'S VERDICT
          </Text>
          <BennyBubble text={bennyMsg} mood={bennyMood} />
          <View style={styles.reactionStats}>
            {[
              { label: "SETS", value: stats.sets.toString() },
              {
                label: "VOLUME",
                value: stats.volume > 0 ? `${stats.volume.toLocaleString()}lbs` : "—",
              },
              { label: "AVG RPE", value: stats.rpe || "—" },
            ].map((s) => (
              <View key={s.label} style={styles.reactionStat}>
                <Text
                  style={[
                    styles.reactionStatVal,
                    { color: isGood ? Colors.success : Colors.accent },
                  ]}
                >
                  {s.value}
                </Text>
                <Text style={styles.reactionStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => router.replace("/")}
            style={[
              styles.homeBtn,
              { backgroundColor: isGood ? Colors.success : Colors.accent },
            ]}
          >
            <Text style={styles.homeBtnText}>BACK TO HOME</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === "workout" && generatedWorkout) {
    return (
      <>
        <Modal
          visible={substituteModal}
          animationType="slide"
          transparent
          onRequestClose={() => setSubstituteModal(false)}
        >
          <View style={styles.subOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.subModalWrapper}
            >
              <View style={styles.subModal}>
                <View style={styles.subModalHeader}>
                  <Text style={styles.subModalTitle}>SUBSTITUTE EXERCISE</Text>
                  <Pressable onPress={() => setSubstituteModal(false)}>
                    <Feather name="x" size={20} color={Colors.textSecondary} />
                  </Pressable>
                </View>
                <Text style={styles.subModalExercise}>{substituteTarget?.name}</Text>
                <Text style={styles.subModalLabel}>What don't you have?</Text>
                <TextInput
                  style={styles.subModalInput}
                  placeholder="e.g. no cable machine, no barbell..."
                  placeholderTextColor={Colors.textMuted}
                  value={substituteReason}
                  onChangeText={setSubstituteReason}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSubstitute}
                />
                {substituteError ? (
                  <Text style={styles.subErrorText}>{substituteError}</Text>
                ) : null}
                {substituteLoading ? (
                  <View style={styles.subLoadingRow}>
                    <ActivityIndicator color={Colors.warning} size="small" />
                    <Text style={styles.subLoadingText}>Benny is thinking...</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={handleSubstitute}
                    style={[
                      styles.subBtn,
                      { opacity: substituteReason.trim() ? 1 : 0.4 },
                    ]}
                    disabled={!substituteReason.trim()}
                  >
                    <Text style={styles.subBtnText}>SWAP IT OUT</Text>
                  </Pressable>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        <ScrollView
          style={[styles.workoutScroll, { backgroundColor: "#0B0F14" }]}
          contentContainerStyle={[
            styles.workoutContent,
            {
              paddingTop: isWeb ? 67 : insets.top + 12,
              paddingBottom: isWeb ? 34 + 80 : insets.bottom + 80,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.workoutHeader}>
            <Pressable onPress={() => setPhase("prompt")} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={Colors.text} />
            </Pressable>
            <View style={styles.workoutTitleArea}>
              <Text style={[styles.workoutSessionLabel, { color: Colors.warning + "99" }]}>
                BENNY'S WORKOUT
              </Text>
              <Text style={[styles.workoutSessionName, { color: Colors.warning }]} numberOfLines={2}>
                "{generatedWorkout.name}"
              </Text>
            </View>
          </View>

          <View style={styles.bennyIntroCard}>
            <MaterialCommunityIcons name="dog" size={18} color={Colors.warning} />
            <Text style={styles.bennyIntroText}>{generatedWorkout.bennyIntro}</Text>
          </View>

          {showRestTimer && (
            <RestTimer
              onDismiss={() => { setShowRestTimer(false); }}
              onBennyImpatient={(msg) => {
                setTimerBennyMsg(msg);
                setShowRestTimer(false);
              }}
            />
          )}

          {timerBennyMsg ? (
            <View style={styles.timerBennyCard}>
              <Text style={styles.timerBennyText}>{timerBennyMsg}</Text>
              <Pressable onPress={() => setTimerBennyMsg("")} hitSlop={8}>
                <Feather name="x" size={12} color={Colors.warning + "88"} />
              </Pressable>
            </View>
          ) : null}

          {exerciseList.map((ex) => {
            const currentSets = sets[ex.name] || [{ weight: "", reps: "", rpe: "" }];
            return (
              <View key={ex.name} style={styles.exerciseWrapper}>
                <View style={styles.exerciseMeta}>
                  <View style={styles.exerciseMetaLeft}>
                    <Text style={styles.exerciseMetaSets}>
                      {ex.sets} sets · {ex.reps}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => openSubstituteModal(ex)}
                    style={styles.subButton}
                  >
                    <Feather name="refresh-cw" size={12} color={Colors.textSecondary} />
                    <Text style={styles.subButtonText}>SUBSTITUTE</Text>
                  </Pressable>
                </View>

                <ExerciseCard
                  exercise={ex.name}
                  sets={currentSets}
                  onSetsChange={(newSets) => updateSets(ex.name, newSets)}
                  onAddSet={(lastSet) => handleSetComplete(ex.name, lastSet)}
                  accent={Colors.warning}
                  cardBg={Colors.bgCard}
                  bennyLine={exerciseBennyLines[ex.name] || ex.bennyComment}
                  bennyLoading={exerciseBennyLoading[ex.name]}
                />
              </View>
            );
          })}

          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>SESSION NOTES</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="How'd it go? (Optional)"
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
            />
          </View>

          <Pressable
            onPress={saveWorkout}
            disabled={saving}
            style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="dog" size={16} color="#000" />
                <Text style={styles.saveBtnText}>FINISH &amp; SAVE</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </>
    );
  }

  return (
    <ScrollView
      style={styles.promptScroll}
      contentContainerStyle={[
        styles.promptContent,
        {
          paddingTop: isWeb ? 67 : insets.top + 12,
          paddingBottom: isWeb ? 34 + 40 : insets.bottom + 40,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={Colors.text} />
      </Pressable>

      <View style={styles.promptHeader}>
        <MaterialCommunityIcons name="dog" size={36} color={Colors.warning} />
        <Text style={styles.promptTitle}>BUILD ME A WORKOUT</Text>
        <Text style={styles.promptSubtitle}>
          Tell Benny what you want to hit today and he'll design something for you.
          Probably with a comment about it.
        </Text>
      </View>

      <View style={styles.chipsRow}>
        {QUICK_CHIPS.map((chip) => (
          <Pressable
            key={chip}
            onPress={() => handleChip(chip)}
            style={[
              styles.chip,
              promptText === chip && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                promptText === chip && styles.chipTextActive,
              ]}
            >
              {chip}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.inputArea}>
        <Text style={styles.inputLabel}>OR DESCRIBE IT YOURSELF</Text>
        <TextInput
          style={styles.promptInput}
          multiline
          placeholder="e.g. chest and shoulders, I have 30 minutes, no barbell..."
          placeholderTextColor={Colors.textMuted}
          value={promptText}
          onChangeText={setPromptText}
          maxLength={300}
        />
      </View>

      {generateError ? (
        <Text style={styles.errorText}>{generateError}</Text>
      ) : null}

      <Pressable
        onPress={handleGenerate}
        disabled={phase === "generating" || !promptText.trim()}
        style={[
          styles.generateBtn,
          { opacity: phase === "generating" || !promptText.trim() ? 0.4 : 1 },
        ]}
      >
        {phase === "generating" ? (
          <View style={styles.generatingRow}>
            <ActivityIndicator color="#000" size="small" />
            <Text style={styles.generateBtnText}>Benny is thinking...</Text>
          </View>
        ) : (
          <>
            <MaterialCommunityIcons name="dog" size={16} color="#000" />
            <Text style={styles.generateBtnText}>LET BENNY BUILD IT</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  promptScroll: { flex: 1, backgroundColor: Colors.bg },
  promptContent: { paddingHorizontal: 20 },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  promptHeader: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  promptTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: 2,
    textAlign: "center",
  },
  promptSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipActive: {
    borderColor: Colors.warning + "88",
    backgroundColor: Colors.warning + "18",
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.warning,
  },
  inputArea: { marginBottom: 16 },
  inputLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  promptInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    padding: 14,
    minHeight: 90,
    textAlignVertical: "top",
  },
  errorText: {
    color: Colors.accent,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.warning,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  generatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  generateBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#000",
    letterSpacing: 1,
  },

  workoutScroll: { flex: 1 },
  workoutContent: { paddingHorizontal: 16 },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  workoutTitleArea: { flex: 1 },
  workoutSessionLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 2,
  },
  workoutSessionName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  bennyIntroCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: Colors.warning + "12",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + "33",
    padding: 12,
    marginBottom: 16,
  },
  bennyIntroText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 19,
  },

  exerciseWrapper: {
    marginBottom: 16,
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  exerciseMetaLeft: {},
  exerciseMetaSets: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.warning + "BB",
    letterSpacing: 0.5,
  },
  subButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  subButtonText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  timerBennyCard: {
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
  timerBennyText: {
    flex: 1,
    fontSize: 12,
    color: Colors.warning,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginRight: 8,
  },

  notesSection: { marginBottom: 20 },
  notesLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    padding: 12,
    minHeight: 70,
    textAlignVertical: "top",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.warning,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#000",
    letterSpacing: 1,
  },

  subOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  subModalWrapper: {
    justifyContent: "flex-end",
  },
  subModal: {
    backgroundColor: Colors.bgElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  subModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subModalTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  subModalExercise: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  subModalLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  subModalInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    padding: 12,
  },
  subErrorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.accent,
    textAlign: "center",
    paddingVertical: 4,
  },
  subLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    paddingVertical: 8,
  },
  subLoadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  subBtn: {
    backgroundColor: Colors.warning,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  subBtnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#000",
    letterSpacing: 1,
  },

  reactionScreen: {
    flex: 1,
  },
  reactionContent: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionNameVerdict: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 22,
  },
  verdictLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  reactionStats: {
    flexDirection: "row",
    gap: 24,
    justifyContent: "center",
    marginTop: 4,
  },
  reactionStat: {
    alignItems: "center",
    gap: 4,
  },
  reactionStatVal: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  reactionStatLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  homeBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  homeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#000",
    letterSpacing: 1,
  },
});
