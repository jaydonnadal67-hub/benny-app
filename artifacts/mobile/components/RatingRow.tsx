import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

type Props = {
  label: string;
  value: number;
  onChange: (n: number) => void;
  iconName: string;
};

export function RatingRow({ label, value, onChange, iconName }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.icon}>{iconName}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}/5</Text>
      </View>
      <View style={styles.buttons}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={({ pressed }) => [
              styles.btn,
              n <= value
                ? { backgroundColor: Colors.warning }
                : { backgroundColor: "rgba(255,255,255,0.07)" },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text
              style={[
                styles.btnText,
                { color: n <= value ? "#000" : Colors.textMuted },
              ]}
            >
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  value: {
    color: Colors.warning,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
