import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { BennyBubble } from "@/components/BennyBubble";
import { Colors } from "@/constants/colors";
import { useAskBenny } from "@/utils/useAskBenny";
import type { BennyMood } from "@/types";

const CARDIO_TYPES = [
  { id: "running", label: "Running", icon: "run" },
  { id: "bike", label: "Bike", icon: "bike" },
  { id: "incline_walk", label: "Incline Walk", icon: "walk" },
  { id: "hiit", label: "HIIT", icon: "lightning-bolt" },
  { id: "rowing", label: "Rowing", icon: "rowing" },
  { id: "elliptical", label: "Elliptical", icon: "rotate-3d-variant" },
  { id: "swimming", label: "Swimming", icon: "swim" },
  { id: "stairmaster", label: "Stairmaster", icon: "stairs" },
];

const DURATION_PRESETS = [15, 20, 30, 45, 60];

const TYPE_COLORS: Record<string, string> = {
  running: Colors.accent,
  bike: Colors.info,
  incline_walk: Colors.success,
  hiit: "#FF6B35",
  rowing: Colors.pull.accent,
  elliptical: Colors.purple,
  swimming: "#00BCD4",
  stairmaster: Colors.warning,
};

export default function CardioScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { cardio, addCardio } = useApp();
  const askBenny = useAskBenny();

  const [selectedType, setSelectedType] = useState("running");
  const [duration, setDuration] = useState("30");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [bennyMsg, setBennyMsg] = useState("");
  const [bennyMood, setBennyMood] = useState<BennyMood>("cardio");
  const [showResult, setShowResult] = useState(false);

  const typeInfo = CARDIO_TYPES.find((t) => t.id === selectedType)!;
  const accent = TYPE_COLORS[selectedType] || Colors.accent;
  const mins = parseInt(duration) || 0;

  const parsedDistance = parseFloat(distance);
  const distanceMiles = !isNaN(parsedDistance) && parsedDistance > 0 ? parsedDistance : undefined;

  const logCardio = async () => {
    if (!mins || mins <= 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSaving(true);

    const distanceStr = distanceMiles ? ` Distance: ${distanceMiles} miles.` : "";
    const prompt = `You are Benny, a sarcastic dachshund fitness coach. Your owner just finished cardio.
Cardio: ${typeInfo.label} for ${mins} minutes.${distanceStr} ${notes ? `Their note: "${notes}".` : ""}
React as Benny. ${mins < 15 ? "That's barely a warm-up — roast them lovingly." : mins >= 45 ? "Impressive — reluctantly admit it while maintaining sausage dog dignity." : "Acknowledge it happened, give credit."} Reference the specific activity and duration. 2-3 sentences. Small dog, big cardio opinions.`;

    const { message, mood } = await askBenny(prompt, "cardio");
    setBennyMsg(message);
    setBennyMood(mood);

    await addCardio({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: typeInfo.label,
      duration: mins,
      notes,
      bennyQuote: message.slice(0, 150),
      distance: distanceMiles,
    });

    setSaving(false);
    setShowResult(true);
  };

  const reset = () => {
    setSelectedType("running");
    setDuration("30");
    setDistance("");
    setNotes("");
    setBennyMsg("");
    setShowResult(false);
  };

  const recentCardio = cardio.slice(0, 8);

  if (showResult) {
    return (
      <View style={[styles.screen, { backgroundColor: accent + "10" }]}>
        <View
          style={[
            styles.topBar,
            { paddingTop: isWeb ? 67 : insets.top + 8 },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: accent }]}>CARDIO LOGGED</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20 },
          ]}
        >
          <View style={[styles.resultCard, { borderColor: accent + "44" }]}>
            <MaterialCommunityIcons
              name={typeInfo.icon as any}
              size={48}
              color={accent}
            />
            <Text style={[styles.resultType, { color: accent }]}>
              {typeInfo.label.toUpperCase()}
            </Text>
            <Text style={styles.resultDuration}>{mins} minutes</Text>
            {distanceMiles ? (
              <Text style={[styles.resultDistance, { color: accent }]}>
                {distanceMiles} mi
              </Text>
            ) : null}
            {notes ? <Text style={styles.resultNotes}>"{notes}"</Text> : null}
          </View>
          <BennyBubble text={bennyMsg} mood={bennyMood} />
          <Pressable
            onPress={reset}
            style={[styles.logAnotherBtn, { borderColor: accent + "66", backgroundColor: accent + "10" }]}
          >
            <Feather name="plus" size={16} color={accent} />
            <Text style={[styles.logAnotherText, { color: accent }]}>LOG ANOTHER</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/")} style={styles.homeBtn}>
            <Text style={styles.homeBtnText}>BACK TO HOME</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={[styles.pageTitle, { color: accent }]}>CARDIO</Text>
          <Text style={styles.topDate}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>ACTIVITY TYPE</Text>
        <View style={styles.typeGrid}>
          {CARDIO_TYPES.map((t) => {
            const isSelected = selectedType === t.id;
            const color = TYPE_COLORS[t.id] || Colors.accent;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedType(t.id);
                }}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isSelected ? color + "25" : "rgba(255,255,255,0.04)",
                    borderColor: isSelected ? color : Colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={t.icon as any}
                  size={20}
                  color={isSelected ? color : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: isSelected ? color : Colors.textMuted },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>DURATION (MINUTES)</Text>
        <View style={styles.durationRow}>
          {DURATION_PRESETS.map((p) => (
            <Pressable
              key={p}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDuration(p.toString());
              }}
              style={[
                styles.durationChip,
                {
                  backgroundColor:
                    duration === p.toString()
                      ? accent + "22"
                      : "rgba(255,255,255,0.04)",
                  borderColor:
                    duration === p.toString() ? accent : Colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.durationLabel,
                  { color: duration === p.toString() ? accent : Colors.textMuted },
                ]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
          <TextInput
            style={[styles.durationInput, { borderColor: Colors.border }]}
            placeholder="other"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />
        </View>

        {mins > 0 && (
          <View style={[styles.durationDisplay, { backgroundColor: accent + "12", borderColor: accent + "33" }]}>
            <MaterialCommunityIcons
              name={typeInfo.icon as any}
              size={22}
              color={accent}
            />
            <Text style={[styles.durationDisplayText, { color: accent }]}>
              {typeInfo.label} · {mins} min
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>DISTANCE (MILES, OPTIONAL)</Text>
        <TextInput
          style={styles.distanceInput}
          placeholder="e.g. 3.1"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
          value={distance}
          onChangeText={setDistance}
        />

        <Text style={styles.sectionLabel}>NOTES (OPTIONAL)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="How was it? PR? Wanted to die?"
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        <Pressable
          onPress={logCardio}
          disabled={saving || !mins}
          style={({ pressed }) => [
            styles.logBtn,
            {
              backgroundColor: accent,
              opacity: saving || !mins || pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={typeInfo.icon as any}
            size={20}
            color="#fff"
          />
          <Text style={styles.logBtnText}>
            {saving ? "LOGGING..." : "LOG CARDIO"}
          </Text>
        </Pressable>

        {recentCardio.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>RECENT SESSIONS</Text>
            {recentCardio.map((s) => {
              const sColor = TYPE_COLORS[
                CARDIO_TYPES.find((t) => t.label === s.type)?.id || "running"
              ] || Colors.accent;
              return (
                <View key={s.id} style={[styles.historyCard, { borderLeftColor: sColor }]}>
                  <View style={styles.historyLeft}>
                    <Text style={[styles.historyType, { color: sColor }]}>
                      {s.type}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(s.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                    {s.distance ? (
                      <Text style={[styles.historyDistance, { color: sColor }]}>
                        {s.distance} mi
                      </Text>
                    ) : null}
                    {s.notes ? (
                      <Text style={styles.historyNotes}>"{s.notes}"</Text>
                    ) : null}
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyDuration, { color: sColor }]}>
                      {s.duration}
                    </Text>
                    <Text style={styles.historyMin}>min</Text>
                  </View>
                </View>
              );
            })}
          </>
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
  pageTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  topDate: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  sectionLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  typeLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  durationChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    minWidth: 48,
  },
  durationLabel: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  durationInput: {
    flex: 1,
    minWidth: 60,
    height: 42,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  durationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  durationDisplayText: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  distanceInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    height: 48,
  },
  notesInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 70,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  logBtn: {
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logBtnText: { color: "#fff", fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  historyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  historyLeft: { flex: 1 },
  historyType: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  historyDate: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  historyDistance: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 2 },
  historyNotes: { fontSize: 11, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2, fontStyle: "italic" },
  historyRight: { alignItems: "center" },
  historyDuration: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", lineHeight: 32 },
  historyMin: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  resultCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  resultType: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 3 },
  resultDuration: { fontSize: 40, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, marginVertical: 4 },
  resultDistance: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  resultNotes: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  logAnotherBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  logAnotherText: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  homeBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  homeBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
});
