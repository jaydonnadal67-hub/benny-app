import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";
import { DAY_THEMES } from "@/constants/workouts";
import { deriveMuscleGroups } from "@/utils/muscleGroups";
import type { WorkoutSession } from "@/types";

type DayTheme = "push" | "pull" | "legs" | "upper";

const THEME_ACCENTS: Record<DayTheme, string> = {
  push: Colors.push.accent,
  pull: Colors.pull.accent,
  legs: Colors.legs.accent,
  upper: Colors.upper.accent,
};

const THEME_CARD: Record<DayTheme, string> = {
  push: Colors.push.card,
  pull: Colors.pull.card,
  legs: Colors.legs.card,
  upper: Colors.upper.card,
};

function SessionCard({ session }: { session: WorkoutSession }) {
  const [expanded, setExpanded] = useState(false);
  const theme = (DAY_THEMES[session.day as keyof typeof DAY_THEMES] || "push") as DayTheme;
  const accent = THEME_ACCENTS[theme];
  const cardBg = THEME_CARD[theme];

  const muscleGroups = session.muscleGroups && session.muscleGroups.length > 0
    ? session.muscleGroups
    : deriveMuscleGroups(Object.keys(session.exercises));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded((e) => !e);
      }}
      style={[styles.sessionCard, { backgroundColor: cardBg }]}
    >
      <View style={[styles.sessionAccent, { backgroundColor: accent }]} />
      <View style={styles.sessionContent}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderLeft}>
            <Text style={[styles.sessionDay, { color: accent }]}>{session.day}</Text>
            <Text style={styles.sessionDate}>
              {new Date(session.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
            {muscleGroups.length > 0 && (
              <Text style={[styles.sessionMuscles, { color: accent + "BB" }]}>
                {muscleGroups.join(" · ")}
              </Text>
            )}
          </View>
          <View style={styles.sessionHeaderRight}>
            <Text style={styles.sessionMeta}>{session.totalSets} sets</Text>
            {session.totalVolume > 0 && (
              <Text style={[styles.sessionVol, { color: accent }]}>
                {session.totalVolume.toLocaleString()} lbs
              </Text>
            )}
            <Feather
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={Colors.textMuted}
            />
          </View>
        </View>

        {expanded && (
          <View style={styles.expanded}>
            {Object.entries(session.exercises).map(([ex, sets]) => {
              const logged = sets.filter((s) => s.weight && s.reps);
              if (!logged.length) return null;
              return (
                <View key={ex} style={styles.exRow}>
                  <Text style={styles.exName}>{ex}</Text>
                  {logged.map((s, i) => (
                    <Text key={i} style={styles.setDetail}>
                      Set {i + 1}: {s.weight}lbs × {s.reps} reps
                      {s.rpe ? ` @ RPE ${s.rpe}` : ""}
                    </Text>
                  ))}
                </View>
              );
            })}
            {session.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>"{session.notes}"</Text>
              </View>
            ) : null}
            {session.bennyQuote ? (
              <View style={[styles.bennyQuote, { borderColor: Colors.warning + "33" }]}>
                <MaterialCommunityIcons name="dog" size={14} color={Colors.warning} />
                <Text style={styles.bennyQuoteText}>"{session.bennyQuote}"</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function WeeklyMuscleModal({
  visible,
  onClose,
  history,
}: {
  visible: boolean;
  onClose: () => void;
  history: WorkoutSession[];
}) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekSessions = history.filter((s) => {
    const d = new Date(s.date);
    return d >= startOfWeek;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const allMuscles = new Set<string>();
  thisWeekSessions.forEach((s) => {
    const muscles = s.muscleGroups && s.muscleGroups.length > 0
      ? s.muscleGroups
      : deriveMuscleGroups(Object.keys(s.exercises));
    muscles.forEach((m) => allMuscles.add(m));
  });

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <View style={mStyles.handle} />
          <View style={mStyles.header}>
            <Text style={mStyles.title}>THIS WEEK'S MUSCLES</Text>
            <Pressable onPress={onClose} hitSlop={12} style={mStyles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          {thisWeekSessions.length === 0 ? (
            <View style={mStyles.empty}>
              <MaterialCommunityIcons name="dog-side" size={40} color={Colors.textMuted} />
              <Text style={mStyles.emptyText}>No workouts this week yet.</Text>
              <Text style={mStyles.emptySubText}>Get after it.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={mStyles.totalRow}>
                <Text style={mStyles.totalLabel}>TOTAL MUSCLE GROUPS HIT</Text>
                <Text style={mStyles.totalCount}>{allMuscles.size}</Text>
              </View>
              {thisWeekSessions.map((s) => {
                const muscles = s.muscleGroups && s.muscleGroups.length > 0
                  ? s.muscleGroups
                  : deriveMuscleGroups(Object.keys(s.exercises));
                const theme = (DAY_THEMES[s.day as keyof typeof DAY_THEMES] || "push") as DayTheme;
                const accent = THEME_ACCENTS[theme];
                return (
                  <View key={s.id} style={mStyles.dayBlock}>
                    <View style={mStyles.dayHeader}>
                      <View style={[mStyles.dayDot, { backgroundColor: accent }]} />
                      <View>
                        <Text style={[mStyles.dayName, { color: accent }]}>{s.day}</Text>
                        <Text style={mStyles.dayDate}>
                          {new Date(s.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </View>
                    </View>
                    {muscles.length > 0 ? (
                      <View style={mStyles.muscleList}>
                        {muscles.map((m) => (
                          <View key={m} style={[mStyles.muscleChip, { borderColor: accent + "55", backgroundColor: accent + "11" }]}>
                            <Text style={[mStyles.muscleChipText, { color: accent }]}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={mStyles.noMuscles}>No exercises logged</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { history } = useApp();
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);

  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>WORKOUT HISTORY</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowWeeklyModal(true);
          }}
          style={styles.weeklyBtn}
        >
          <MaterialCommunityIcons name="arm-flex" size={18} color={Colors.purple} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="clipboard" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>NO HISTORY YET</Text>
            <Text style={styles.emptyText}>
              Complete your first workout to see it here.
            </Text>
            <Pressable
              onPress={() => router.replace("/")}
              style={styles.startBtn}
            >
              <Text style={styles.startBtnText}>START A WORKOUT</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.count}>{sorted.length} sessions logged</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowWeeklyModal(true);
                }}
                style={styles.weeklyBtnInline}
              >
                <MaterialCommunityIcons name="arm-flex" size={13} color={Colors.purple} />
                <Text style={styles.weeklyBtnText}>THIS WEEK'S MUSCLES</Text>
              </Pressable>
            </View>
            {sorted.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </>
        )}
      </ScrollView>

      <WeeklyMuscleModal
        visible={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
        history={history}
      />
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
  weeklyBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  count: { fontSize: 11, color: Colors.textMuted, letterSpacing: 1, fontFamily: "Inter_600SemiBold" },
  weeklyBtnInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.purple + "18",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.purple + "44",
  },
  weeklyBtnText: { fontSize: 10, color: Colors.purple, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  sessionCard: {
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    overflow: "hidden",
  },
  sessionAccent: { width: 4 },
  sessionContent: { flex: 1, padding: 14 },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sessionHeaderLeft: { flex: 1 },
  sessionDay: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  sessionDate: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  sessionMuscles: { fontSize: 10, fontFamily: "Inter_600SemiBold", marginTop: 3, letterSpacing: 0.3 },
  sessionHeaderRight: { alignItems: "flex-end", gap: 2 },
  sessionMeta: { fontSize: 11, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  sessionVol: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  expanded: { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  exRow: { marginBottom: 10 },
  exName: { color: Colors.text, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 4 },
  setDetail: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginLeft: 12, marginBottom: 2 },
  notesBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  },
  notesText: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  bennyQuote: {
    marginTop: 8,
    padding: 10,
    backgroundColor: Colors.warning + "0A",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bennyQuoteText: { flex: 1, fontSize: 12, color: Colors.warning, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.textSecondary, letterSpacing: 3 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontFamily: "Inter_400Regular", textAlign: "center" },
  startBtn: { marginTop: 12, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
  startBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
});

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: 2,
  },
  closeBtn: { padding: 4 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptySubText: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.purple + "15",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.purple + "33",
  },
  totalLabel: { fontSize: 10, color: Colors.purple, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  totalCount: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.purple },
  dayBlock: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 14,
  },
  dayHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  dayDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  dayName: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  dayDate: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 1 },
  muscleList: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingLeft: 18 },
  muscleChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  muscleChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  noMuscles: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_400Regular", paddingLeft: 18 },
});
