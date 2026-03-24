import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";
import type { AchievementDef } from "@/types";

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first_workout",
    name: "First Blood",
    description: "Logged your very first workout",
    bennyReaction: "...Fine. You showed up. I'm choosing not to be impressed but I am slightly.",
    icon: "dumbbell",
    color: Colors.warning,
  },
  {
    id: "streak_7",
    name: "Streak Starter",
    description: "7 consecutive days with a workout",
    bennyReaction: "Seven days. SEVEN. I didn't think you had it in you. I'm not crying, you're crying.",
    icon: "fire",
    color: Colors.accent,
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    description: "30 day workout streak",
    bennyReaction: "...I need a moment. 30 days. 30. Gerald is absolutely devastated and honestly so am I (in the good way).",
    icon: "medal",
    color: Colors.warning,
  },
  {
    id: "century",
    name: "The Century",
    description: "100 workouts logged",
    bennyReaction: "One hundred. I have watched you grow from someone I barely tolerated into someone I... still barely tolerate. But with significantly more respect.",
    icon: "trophy",
    color: Colors.success,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Logged a workout before 7am",
    bennyReaction: "You woke up before 7am to lift weights. I don't know whether to be proud or concerned. I'm going with both.",
    icon: "weather-sunny",
    color: Colors.warning,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Logged a workout after 9pm",
    bennyReaction: "Late night gains are still gains. Questionable life choices, excellent fitness choices.",
    icon: "weather-night",
    color: Colors.info,
  },
  {
    id: "the_returner",
    name: "The Returner",
    description: "Came back after 5+ days off",
    bennyReaction: "You came back. That's the whole thing. You came back. Gerald thought you were gone forever. He was wrong.",
    icon: "refresh",
    color: Colors.success,
  },
  {
    id: "hydration_nation",
    name: "Hydration Nation",
    description: "Hit water goal 7 days straight",
    bennyReaction: "You drank water. Repeatedly. On purpose. Benny is oddly emotional about this.",
    icon: "water",
    color: Colors.info,
  },
  {
    id: "gerald_slayer",
    name: "Gerald Slayer",
    description: "Perfect week — all workouts, protein, and water goals",
    bennyReaction: "GERALD HAS BEEN DEFEATED. This is the day. This is the day. *Benny is running in circles right now.*",
    icon: "cat",
    color: Colors.accent,
  },
  {
    id: "protein_machine",
    name: "Protein Machine",
    description: "Hit protein goal 14 days straight",
    bennyReaction: "Fourteen days of hitting protein. Fourteen. Your muscles are growing and so is my respect for you. Don't tell anyone I said that.",
    icon: "food-steak",
    color: Colors.push.accent,
  },
];

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { achievements, history } = useApp();

  const unlockedIds = new Set(achievements.map((a) => a.id));
  const unlocked = ACHIEVEMENT_DEFS.filter((d) => unlockedIds.has(d.id));
  const locked = ACHIEVEMENT_DEFS.filter((d) => !unlockedIds.has(d.id));

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={styles.pageTitle}>ACHIEVEMENTS</Text>
          <Text style={styles.pageSubtitle}>{unlocked.length}/{ACHIEVEMENT_DEFS.length} earned</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {unlocked.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>EARNED</Text>
            {unlocked.map((def) => {
              const ach = achievements.find((a) => a.id === def.id)!;
              return (
                <View key={def.id} style={[styles.badge, { borderColor: def.color + "55" }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: def.color + "22", borderColor: def.color + "66" }]}>
                    <MaterialCommunityIcons name={def.icon as any} size={26} color={def.color} />
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeName, { color: def.color }]}>{def.name}</Text>
                    <Text style={styles.badgeDesc}>{def.description}</Text>
                    <Text style={styles.badgeDate}>
                      {new Date(ach.unlockedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                    <Text style={styles.badgeBenny}>"{def.bennyReaction}"</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {locked.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: unlocked.length > 0 ? 24 : 0 }]}>
              LOCKED
            </Text>
            {locked.map((def) => (
              <View key={def.id} style={[styles.badge, styles.lockedBadge]}>
                <View style={[styles.badgeIcon, { backgroundColor: Colors.bgElevated, borderColor: Colors.border }]}>
                  <Feather name="lock" size={20} color={Colors.textMuted} />
                </View>
                <View style={styles.badgeInfo}>
                  <Text style={[styles.badgeName, { color: Colors.textMuted }]}>{def.name}</Text>
                  <Text style={[styles.badgeDesc, { color: Colors.textMuted }]}>{def.description}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {unlocked.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="trophy-outline" size={60} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>NO BADGES YET</Text>
            <Text style={styles.emptyText}>
              Log your first workout to earn your first badge. Benny is watching. Skeptically, but watching.
            </Text>
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
  topCenter: { alignItems: "center" },
  pageTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2 },
  pageSubtitle: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  sectionHeader: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 12 },
  badge: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  lockedBadge: { opacity: 0.5, borderColor: Colors.border },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 3 },
  badgeDesc: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 3 },
  badgeDate: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginBottom: 4 },
  badgeBenny: { fontSize: 11, color: Colors.warning, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  empty: { alignItems: "center", paddingTop: 60, gap: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.textSecondary, letterSpacing: 2 },
  emptyText: { fontSize: 13, color: Colors.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
