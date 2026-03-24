import React from "react";
import { View, TextInput, Pressable, StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import type { SetEntry } from "@/types";

type Props = {
  set: SetEntry;
  index: number;
  onChange: (val: SetEntry) => void;
  onRemove: () => void;
  accent: string;
};

export function SetRow({ set, index, onChange, onRemove, accent }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.setNum, { color: accent }]}>{index + 1}</Text>
      <TextInput
        style={styles.input}
        placeholder="lbs"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numeric"
        value={set.weight}
        onChangeText={(v) => onChange({ ...set, weight: v })}
        returnKeyType="next"
      />
      <TextInput
        style={styles.input}
        placeholder="reps"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numeric"
        value={set.reps}
        onChangeText={(v) => onChange({ ...set, reps: v })}
        returnKeyType="next"
      />
      <TextInput
        style={[styles.input, styles.rpeInput]}
        placeholder="RPE"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numeric"
        value={set.rpe}
        onChangeText={(v) => onChange({ ...set, rpe: v })}
        returnKeyType="done"
      />
      <Pressable onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
        <Feather name="x" size={14} color={Colors.accent + "88"} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  setNum: {
    width: 18,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  rpeInput: {
    flex: 0.8,
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent + "18",
    borderRadius: 6,
  },
});
