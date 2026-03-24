import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import type { BennyMood } from "@/types";

const MOOD_COLORS: Record<BennyMood, string> = {
  good: Colors.success,
  bad: Colors.accent,
  neutral: Colors.warning,
  food: Colors.purple,
  checkin: Colors.info,
  cardio: Colors.success,
  workout: Colors.push.accent,
};

type Props = {
  text?: string;
  mood?: BennyMood;
  loading?: boolean;
};

export function BennyBubble({ text, mood = "neutral", loading = false }: Props) {
  const color = MOOD_COLORS[mood];

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: color + "22", borderColor: color + "88" }]}>
        <MaterialCommunityIcons name="dog" size={26} color={color} />
      </View>
      <View style={[styles.bubble, { backgroundColor: color + "12", borderColor: color + "33" }]}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={color} />
            <Text style={[styles.loadingText, { color: Colors.textSecondary }]}>
              Benny is thinking...
            </Text>
          </View>
        ) : (
          <Text style={styles.text}>{text}</Text>
        )}
        <Text style={[styles.sig, { color }]}>— BENNY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    padding: 14,
  },
  text: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontStyle: "italic",
    fontFamily: "Inter_400Regular",
  },
  sig: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
});
