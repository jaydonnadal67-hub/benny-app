import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { BennyBubble } from "@/components/BennyBubble";
import { Colors } from "@/constants/colors";
import { WORKOUTS } from "@/constants/workouts";
import {
  EXERCISE_LIBRARY,
  MUSCLES,
  filterExercises,
  BENNY_EXERCISE_REACTIONS,
} from "@/constants/exercises";
import { useAskBenny } from "@/utils/useAskBenny";
import { sanitizeInput } from "@/utils/security";
import type { CustomWorkoutDay } from "@/types";
import type { BennyMood } from "@/types";

type Mode = "list" | "editing";

const THEMES = ["push", "pull", "legs", "upper", "custom"] as const;
const THEME_COLORS: Record<string, string> = {
  push: Colors.push.accent,
  pull: Colors.pull.accent,
  legs: Colors.legs.accent,
  upper: Colors.upper.accent,
  custom: Colors.purple,
};

export default function WorkoutBuilderScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { customWorkouts, saveCustomWorkout, deleteCustomWorkout } = useApp();
  const askBenny = useAskBenny();

  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<CustomWorkoutDay | null>(null);
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<string[]>([]);
  const [theme, setTheme] = useState<CustomWorkoutDay["theme"]>("custom");
  const [showLibrary, setShowLibrary] = useState(false);
  const [libSearch, setLibSearch] = useState("");
  const [libMuscle, setLibMuscle] = useState("All");
  const [customExercise, setCustomExercise] = useState("");
  const [bennyMsg, setBennyMsg] = useState("");
  const [bennyMood, setBennyMood] = useState<BennyMood>("neutral");
  const [saving, setSaving] = useState(false);

  const builtInKeys = Object.keys(WORKOUTS);

  const startCreate = () => {
    setEditing(null);
    setWorkoutName("");
    setExercises([]);
    setTheme("custom");
    setBennyMsg("");
    setMode("editing");
  };

  const startEdit = (w: CustomWorkoutDay) => {
    setEditing(w);
    setWorkoutName(w.name);
    setExercises([...w.exercises]);
    setTheme(w.theme);
    setBennyMsg("");
    setMode("editing");
  };

  const startEditBuiltIn = (name: string) => {
    const exercises = WORKOUTS[name as keyof typeof WORKOUTS] || [];
    const theme = name.toLowerCase().includes("push")
      ? "push"
      : name.toLowerCase().includes("pull")
        ? "pull"
        : name.toLowerCase().includes("leg")
          ? "legs"
          : "upper";
    const existing = customWorkouts.find((c) => c.name === name && c.isBuiltIn);
    if (existing) {
      startEdit(existing);
    } else {
      setEditing(null);
      setWorkoutName(name);
      setExercises([...exercises]);
      setTheme(theme as CustomWorkoutDay["theme"]);
      setBennyMsg("");
      setMode("editing");
    }
  };

  const addExercise = async (name: string) => {
    if (exercises.includes(name)) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...exercises, name];
    setExercises(updated);
    setShowLibrary(false);
    setLibSearch("");
    const reaction = BENNY_EXERCISE_REACTIONS[name];
    if (reaction) {
      setBennyMsg(reaction);
      setBennyMood("workout");
    } else {
      const prompt = `You are Benny, a sarcastic dachshund gym coach. ONE sentence reaction to the user adding "${name}" to their custom workout day. Be specific to this exercise. Sarcastic but encouraging.`;
      const { message, mood } = await askBenny(prompt, "workout");
      setBennyMsg(message);
      setBennyMood(mood);
    }
  };

  const removeExercise = async (name: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercises((prev) => prev.filter((e) => e !== name));
    const isSquat = name.toLowerCase().includes("squat");
    const isDeadlift = name.toLowerCase().includes("deadlift");
    if (isSquat) {
      setBennyMsg("*Benny lies face-down on the floor* You removed squats. I hope you're happy. I'm not.");
      setBennyMood("bad");
    } else if (isDeadlift) {
      setBennyMsg("*audible gasp* Not the deadlifts. ANYTHING but the deadlifts. I am personally devastated.");
      setBennyMood("bad");
    } else {
      const prompt = `You are Benny, a tiny dachshund gym coach. ONE short sarcastic reaction to removing "${name}" from a workout. Be specific. Could be "coward", could be reluctant acceptance.`;
      const { message, mood } = await askBenny(prompt, "workout");
      setBennyMsg(message);
      setBennyMood(mood);
    }
  };

  const addCustomExercise = () => {
    if (!customExercise.trim()) return;
    addExercise(sanitizeInput(customExercise.trim(), "exercise"));
    setCustomExercise("");
  };

  const save = async () => {
    if (!workoutName.trim() || exercises.length === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const workout: CustomWorkoutDay = {
      id: editing?.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: sanitizeInput(workoutName.trim(), "workout"),
      exercises,
      theme,
      isBuiltIn: builtInKeys.includes(workoutName.trim()),
    };

    await saveCustomWorkout(workout);
    setSaving(false);
    setMode("list");
    setBennyMsg("");
  };

  const deleteWorkout = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await deleteCustomWorkout(id);
  };

  const filteredExercises = filterExercises(libSearch, libMuscle).filter(
    (e) => !exercises.includes(e.name),
  );

  if (mode === "editing") {
    const accent = THEME_COLORS[theme] || Colors.purple;

    return (
      <View style={styles.screen}>
        <Modal visible={showLibrary} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.libraryModal}>
            <View style={styles.libHeader}>
              <Pressable onPress={() => setShowLibrary(false)} style={styles.backBtn}>
                <Feather name="x" size={22} color={Colors.text} />
              </Pressable>
              <Text style={styles.libTitle}>EXERCISE LIBRARY</Text>
              <View style={{ width: 36 }} />
            </View>

            <TextInput
              style={styles.libSearch}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.textMuted}
              value={libSearch}
              onChangeText={setLibSearch}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleFilter} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
              {MUSCLES.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setLibMuscle(m)}
                  style={[styles.muscleChip, libMuscle === m && { backgroundColor: Colors.warning + "33", borderColor: Colors.warning }]}
                >
                  <Text style={[styles.muscleChipText, libMuscle === m && { color: Colors.warning }]}>{m}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <Pressable onPress={() => addExercise(item.name)} style={styles.libExerciseRow}>
                  <View>
                    <Text style={[styles.libExerciseName, item.bennyFavors && { color: Colors.success }, item.bennyHates && { color: Colors.accent }]}>
                      {item.name}
                      {item.bennyFavors ? " ★" : item.bennyHates ? " ✗" : ""}
                    </Text>
                    <Text style={styles.libExerciseMuscle}>{item.muscle}</Text>
                  </View>
                  <Feather name="plus-circle" size={20} color={accent} />
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
              contentContainerStyle={{ paddingBottom: 40 }}
            />

            <View style={styles.customExRow}>
              <TextInput
                style={styles.customExInput}
                placeholder="Add custom exercise..."
                placeholderTextColor={Colors.textMuted}
                value={customExercise}
                onChangeText={setCustomExercise}
                onSubmitEditing={addCustomExercise}
              />
              <Pressable onPress={addCustomExercise} style={[styles.customExBtn, { backgroundColor: accent }]}>
                <Feather name="plus" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </Modal>

        <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
          <Pressable onPress={() => setMode("list")} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: accent }]}>
            {editing ? "EDIT WORKOUT" : "CREATE WORKOUT"}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={[styles.nameInput, { borderColor: accent + "66" }]}
            placeholder="Workout name (e.g. Arm Farm, Chest Obsession)"
            placeholderTextColor={Colors.textMuted}
            value={workoutName}
            onChangeText={setWorkoutName}
          />

          <View style={styles.themeRow}>
            <Text style={styles.themeLabel}>COLOR THEME</Text>
            <View style={styles.themeChips}>
              {THEMES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTheme(t)}
                  style={[styles.themeChip, {
                    backgroundColor: THEME_COLORS[t] + (theme === t ? "33" : "11"),
                    borderColor: THEME_COLORS[t] + (theme === t ? "99" : "33"),
                  }]}
                >
                  <Text style={[styles.themeChipText, { color: THEME_COLORS[t] }]}>
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {bennyMsg ? <BennyBubble text={bennyMsg} mood={bennyMood} /> : null}

          <Text style={styles.exercisesHeader}>
            EXERCISES ({exercises.length})
          </Text>

          {exercises.map((ex, i) => (
            <View key={ex} style={[styles.exerciseRow, { borderColor: accent + "33" }]}>
              <Text style={styles.exerciseNum}>{i + 1}</Text>
              <Text style={styles.exerciseName}>{ex}</Text>
              <Pressable onPress={() => removeExercise(ex)} style={styles.removeBtn}>
                <Feather name="x" size={16} color={Colors.accent + "99"} />
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() => setShowLibrary(true)}
            style={[styles.addExerciseBtn, { borderColor: accent + "55" }]}
          >
            <Feather name="plus" size={18} color={accent} />
            <Text style={[styles.addExerciseText, { color: accent }]}>ADD EXERCISE FROM LIBRARY</Text>
          </Pressable>

          <Pressable
            onPress={save}
            disabled={!workoutName.trim() || exercises.length === 0 || saving}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: accent,
                opacity: !workoutName.trim() || exercises.length === 0 || pressed || saving ? 0.5 : 1,
              },
            ]}
          >
            <Text style={styles.saveBtnText}>{saving ? "SAVING..." : "SAVE WORKOUT"}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.pageTitle}>WORKOUT BUILDER</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={startCreate} style={styles.createBtn}>
          <Feather name="plus" size={20} color="#000" />
          <Text style={styles.createBtnText}>CREATE CUSTOM WORKOUT DAY</Text>
        </Pressable>

        <Text style={styles.sectionHeader}>MY CUSTOM WORKOUTS</Text>
        {customWorkouts.filter((w) => !w.isBuiltIn).length === 0 ? (
          <Text style={styles.emptyText}>No custom workouts yet. Create your first one!</Text>
        ) : (
          customWorkouts.filter((w) => !w.isBuiltIn).map((w) => {
            const accent = THEME_COLORS[w.theme] || Colors.purple;
            return (
              <View key={w.id} style={[styles.workoutRow, { borderColor: accent + "44" }]}>
                <View style={[styles.workoutAccentBar, { backgroundColor: accent }]} />
                <View style={styles.workoutRowContent}>
                  <Text style={[styles.workoutRowName, { color: accent }]}>{w.name}</Text>
                  <Text style={styles.workoutRowMeta}>{w.exercises.length} exercises</Text>
                </View>
                <Pressable onPress={() => startEdit(w)} style={styles.editBtn}>
                  <Feather name="edit-2" size={16} color={Colors.textSecondary} />
                </Pressable>
                <Pressable onPress={() => deleteWorkout(w.id)} style={styles.deleteBtn}>
                  <Feather name="trash-2" size={16} color={Colors.accent + "99"} />
                </Pressable>
              </View>
            );
          })
        )}

        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>EDIT BUILT-IN DAYS</Text>
        {Object.keys(WORKOUTS).map((day) => {
          const isModified = customWorkouts.some((c) => c.name === day && c.isBuiltIn);
          return (
            <Pressable key={day} onPress={() => startEditBuiltIn(day)} style={[styles.workoutRow, { borderColor: Colors.border }]}>
              <View style={[styles.workoutAccentBar, { backgroundColor: Colors.border }]} />
              <View style={styles.workoutRowContent}>
                <Text style={styles.workoutRowName}>{day}</Text>
                <Text style={styles.workoutRowMeta}>
                  {isModified ? "Modified by you" : `${(WORKOUTS[day as keyof typeof WORKOUTS] || []).length} default exercises`}
                </Text>
              </View>
              <Feather name="edit-2" size={16} color={Colors.textSecondary} />
            </Pressable>
          );
        })}
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
  pageTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  createBtn: {
    backgroundColor: Colors.warning,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  createBtnText: { color: "#000", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  sectionHeader: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 12 },
  emptyText: { fontSize: 13, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginBottom: 12 },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  workoutAccentBar: { width: 4, alignSelf: "stretch" },
  workoutRowContent: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  workoutRowName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: Colors.text },
  workoutRowMeta: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  editBtn: { padding: 14 },
  deleteBtn: { padding: 14 },
  nameInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 16,
  },
  themeRow: { marginBottom: 16 },
  themeLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 8 },
  themeChips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  themeChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  themeChipText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  exercisesHeader: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 10 },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
    gap: 12,
  },
  exerciseNum: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_600SemiBold", width: 20, textAlign: "center" },
  exerciseName: { flex: 1, fontSize: 14, color: Colors.text, fontFamily: "Inter_400Regular" },
  removeBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center", backgroundColor: Colors.accent + "15", borderRadius: 6 },
  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: 14,
    marginTop: 4,
  },
  addExerciseText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  saveBtn: { borderRadius: 14, padding: 18, alignItems: "center" },
  saveBtnText: { color: "#000", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  libraryModal: { flex: 1, backgroundColor: Colors.bg },
  libHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  libTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2 },
  libSearch: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    margin: 16,
    marginBottom: 8,
  },
  muscleFilter: { maxHeight: 44, marginBottom: 8 },
  muscleChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.bgCard,
  },
  muscleChipText: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_600SemiBold" },
  libExerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  libExerciseName: { fontSize: 14, color: Colors.text, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  libExerciseMuscle: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  customExRow: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  customExInput: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  customExBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
