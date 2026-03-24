import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import type { BennyMoodType } from "@/types";

type MoodConfig = {
  color: string;
  icon: string;
  label: string;
  sublabel: string;
};

const MOOD_CONFIG: Record<BennyMoodType, MoodConfig> = {
  zoomies: {
    color: Colors.success,
    icon: "dog",
    label: "ZOOMIES MODE",
    sublabel: "4+ workouts this week. Benny is literally running circles.",
  },
  impressed: {
    color: Colors.info,
    icon: "dog-side",
    label: "IMPRESSED",
    sublabel: "2-3 workouts in. Benny won't say it but he's proud.",
  },
  neutral: {
    color: Colors.warning,
    icon: "dog-side",
    label: "MONITORING",
    sublabel: "You showed up. Benny has taken note. Barely.",
  },
  disappointed: {
    color: "#FF6B35",
    icon: "dog-side",
    label: "DISAPPOINTED",
    sublabel: "It's Wednesday. Where are the reps, human.",
  },
  devastated: {
    color: Colors.accent,
    icon: "dog-side",
    label: "DEVASTATED",
    sublabel: "*dramatic flop* This is fine. Everything is fine. It's not fine.",
  },
};

type Props = {
  mood: BennyMoodType;
  streak: number;
  onPress?: () => void;
};

export function BennyMoodCard({ mood, streak, onPress }: Props) {
  const cfg = MOOD_CONFIG[mood];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { borderColor: cfg.color + "44", backgroundColor: cfg.color + "0C" }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + "22", borderColor: cfg.color + "66" }]}>
        <MaterialCommunityIcons name={cfg.icon as any} size={28} color={cfg.color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.moodLabel, { color: cfg.color }]}>{cfg.label}</Text>
        <Text style={styles.sublabel}>{cfg.sublabel}</Text>
      </View>
      {streak > 0 && (
        <View style={[styles.streakBadge, { backgroundColor: cfg.color + "22", borderColor: cfg.color + "55" }]}>
          <Text style={[styles.streakNum, { color: cfg.color }]}>{streak}</Text>
          <Text style={[styles.streakLabel, { color: cfg.color }]}>DAY{streak !== 1 ? "S" : ""}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  moodLabel: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  streakBadge: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    alignItems: "center",
    minWidth: 44,
  },
  streakNum: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", lineHeight: 22 },
  streakLabel: { fontSize: 8, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
});
