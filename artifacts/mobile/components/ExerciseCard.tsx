import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { SetRow } from "./SetRow";
import type { SetEntry } from "@/types";

type Props = {
  exercise: string;
  sets: SetEntry[];
  onSetsChange: (sets: SetEntry[]) => void;
  onAddSet?: (lastSet: SetEntry) => void;
  accent: string;
  cardBg: string;
  bennyLine?: string;
  bennyLoading?: boolean;
};

export function ExerciseCard({ exercise, sets, onSetsChange, onAddSet, accent, cardBg, bennyLine, bennyLoading }: Props) {
  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    if (lastSet && lastSet.weight && lastSet.reps && onAddSet) {
      onAddSet(lastSet);
    }
    onSetsChange([...sets, { weight: "", reps: "", rpe: "" }]);
  };

  const updateSet = (i: number, val: SetEntry) => {
    const s = [...sets];
    s[i] = val;
    onSetsChange(s);
  };

  const removeSet = (i: number) => {
    onSetsChange(sets.filter((_, idx) => idx !== i));
  };

  const totalVol = sets.reduce(
    (acc, s) => acc + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0),
    0,
  );

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={styles.header}>
        <Text style={styles.exName} numberOfLines={1}>
          {exercise}
        </Text>
        {totalVol > 0 && (
          <Text style={[styles.volume, { color: accent }]}>
            {totalVol.toLocaleString()} lbs
          </Text>
        )}
      </View>

      {sets.length > 0 && (
        <View style={styles.colHeaders}>
          {["#", "WEIGHT", "REPS", "RPE", ""].map((h) => (
            <Text key={h} style={[styles.colHeader, h === "#" && { width: 18 }]}>
              {h}
            </Text>
          ))}
        </View>
      )}

      {sets.map((set, i) => (
        <SetRow
          key={i}
          set={set}
          index={i}
          onChange={(v) => updateSet(i, v)}
          onRemove={() => removeSet(i)}
          accent={accent}
        />
      ))}

      {(bennyLine || bennyLoading) && (
        <View style={[styles.bennyLine, { backgroundColor: Colors.warning + "10", borderColor: Colors.warning + "33" }]}>
          <MaterialCommunityIcons name="dog" size={12} color={Colors.warning} />
          {bennyLoading ? (
            <ActivityIndicator size="small" color={Colors.warning} style={{ marginLeft: 4 }} />
          ) : (
            <Text style={styles.bennyLineText}>{bennyLine}</Text>
          )}
        </View>
      )}

      <Pressable onPress={addSet} style={[styles.addBtn, { borderColor: accent + "66" }]}>
        <Feather name="plus" size={14} color={accent} />
        <Text style={[styles.addText, { color: accent }]}>ADD SET</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  exName: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    marginRight: 8,
  },
  volume: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  colHeaders: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  colHeader: {
    flex: 1,
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textAlign: "center",
  },
  bennyLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  bennyLineText: {
    flex: 1,
    fontSize: 12,
    color: Colors.warning,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  addBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  addText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
});
