import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

type Props = {
  label: string;
  value: string | number;
  color?: string;
};

export function StatCard({ label, value, color = Colors.accent }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  value: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
  },
  label: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
});
