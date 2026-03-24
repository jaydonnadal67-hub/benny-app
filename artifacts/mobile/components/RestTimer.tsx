import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

type Props = {
  onDismiss: () => void;
  onBennyImpatient: (msg: string) => void;
};

const TOTAL = 90;

export function RestTimer({ onDismiss, onBennyImpatient }: Props) {
  const [seconds, setSeconds] = useState(TOTAL);
  const [running, setRunning] = useState(true);
  const [expired, setExpired] = useState(false);
  const firedImpatient = useRef(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      setExpired(true);
      if (!firedImpatient.current) {
        firedImpatient.current = true;
        const msgs = [
          "*aggressively sniffing your foot* Are you napping or resting? THERE IS A DIFFERENCE.",
          "90 seconds went all the way to zero and you're still just... sitting there. Bold strategy.",
          "*tilts head so far it almost falls off* The bar is waiting. The bar is judging. I am judging.",
          "That timer didn't die so you could scroll your phone. GET. BACK. UNDER. THE. BAR.",
          "*dramatic flop onto side* I've been lying here the whole rest. Unlike YOU, I'm exhausted from watching.",
        ];
        onBennyImpatient(msgs[Math.floor(Math.random() * msgs.length)]);
      }
      return;
    }
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds, onBennyImpatient]);

  const dismiss = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }, [opacity, onDismiss]);

  const pct = seconds / TOTAL;
  const color =
    seconds > 60 ? Colors.success : seconds > 30 ? Colors.warning : Colors.accent;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={[styles.card, { borderColor: color + "55" }]}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="timer-outline" size={16} color={color} />
          <Text style={[styles.label, { color }]}>REST TIMER</Text>
          <Pressable onPress={dismiss} hitSlop={10}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.time, { color: expired ? Colors.accent : color }]}>
          {expired ? "GO!" : timeStr}
        </Text>

        <View style={[styles.barBg, { backgroundColor: Colors.border }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${pct * 100}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>

        <View style={styles.buttons}>
          <Pressable
            onPress={() => {
              setSeconds(TOTAL);
              setRunning(true);
              setExpired(false);
              firedImpatient.current = false;
            }}
            style={styles.resetBtn}
          >
            <Feather name="rotate-ccw" size={14} color={Colors.textMuted} />
            <Text style={styles.resetText}>RESET</Text>
          </Pressable>
          <Pressable
            onPress={() => setRunning((r) => !r)}
            style={[styles.pauseBtn, { borderColor: color + "55" }]}
          >
            <Feather name={running ? "pause" : "play"} size={14} color={color} />
            <Text style={[styles.pauseText, { color }]}>
              {running ? "PAUSE" : "RESUME"}
            </Text>
          </Pressable>
          <Pressable onPress={dismiss} style={[styles.skipBtn, { backgroundColor: color }]}>
            <Text style={styles.skipText}>NEXT SET</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  time: {
    fontSize: 52,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 60,
    marginBottom: 10,
  },
  barBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  resetText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pauseText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  skipBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  skipText: {
    fontSize: 11,
    color: "#000",
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
});
