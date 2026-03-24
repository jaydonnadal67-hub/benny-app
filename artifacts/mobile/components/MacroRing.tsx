import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors } from "@/constants/colors";

type Props = {
  label: string;
  current: number;
  goal: number;
  color: string;
  size?: number;
};

export function MacroRing({ label, current, goal, color, size = 72 }: Props) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min((current / goal) * 100, 100);
  const over = current > goal;
  const strokeColor = over ? Colors.accent : color;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={Colors.border}
          strokeWidth={6}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={6}
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.value, { color: strokeColor }]}>{current}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.goal, { color: strokeColor }]}>/ {goal}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
    fontFamily: "Inter_600SemiBold",
  },
  goal: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
