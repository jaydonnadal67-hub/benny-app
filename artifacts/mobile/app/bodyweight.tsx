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
import { WeightGraph } from "@/components/WeightGraph";
import { Colors } from "@/constants/colors";
import { useAskBenny } from "@/utils/useAskBenny";
import type { BennyMood } from "@/types";

export default function BodyweightScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { weights, addWeight } = useApp();
  const askBenny = useAskBenny();

  const [weightInput, setWeightInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [bennyMsg, setBennyMsg] = useState("");
  const [bennyMood, setBennyMood] = useState<BennyMood>("neutral");
  const [showBenny, setShowBenny] = useState(false);

  const todayStr = new Date().toDateString();
  const todayEntry = weights.find((w) => w.date === todayStr);
  const sorted = [...weights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const lastEntry = sorted[sorted.length - 1];
  const diff = todayEntry && sorted.length >= 2
    ? todayEntry.weight - sorted[sorted.length - 2]?.weight
    : null;

  const logWeight = async () => {
    const val = parseFloat(weightInput);
    if (!val || val < 50 || val > 500) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const entry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: todayStr,
      weight: val,
    };
    await addWeight(entry);

    const trend = diff !== null
      ? diff < 0 ? "dropping" : diff > 0 ? "rising" : "flat"
      : "new entry";
    const daysSinceLast = lastEntry
      ? Math.floor(
          (Date.now() - new Date(lastEntry.date).getTime()) / 86400000,
        )
      : 999;

    const prompt = `You are Benny, a tiny sarcastic dachshund fitness coach. Your owner just logged their body weight.
Weight logged: ${val} lbs. ${diff !== null ? `Change from yesterday: ${diff > 0 ? "+" : ""}${diff.toFixed(1)} lbs.` : "First weigh-in!"}
Trend: ${trend}. Days since last weigh-in: ${daysSinceLast}.
React as Benny: dropping = grudgingly impressed (won't fully admit it), gaining = express concern (gentle, not mean), first weigh-in = welcome to accountability. If ${daysSinceLast >= 3}, act personally offended they skipped days. 2-3 sentences. Tiny dog, big scale opinions.`;

    const { message, mood } = await askBenny(prompt, "greeting");
    setBennyMsg(message);
    setBennyMood(mood);
    setShowBenny(true);
    setWeightInput("");
    setSaving(false);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={[styles.pageTitle, { color: Colors.info }]}>BODY WEIGHT</Text>
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
        <View style={styles.logCard}>
          {todayEntry ? (
            <View style={styles.todayLogged}>
              <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
              <View>
                <Text style={styles.todayLoggedLabel}>TODAY'S WEIGHT</Text>
                <Text style={[styles.todayWeight, { color: Colors.info }]}>
                  {todayEntry.weight} lbs
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.logLabel}>LOG TODAY'S WEIGHT</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.weightInput}
                  placeholder="e.g. 185.5"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  returnKeyType="done"
                  onSubmitEditing={logWeight}
                />
                <Text style={styles.lbsLabel}>lbs</Text>
                <Pressable
                  onPress={logWeight}
                  disabled={saving || !weightInput}
                  style={({ pressed }) => [
                    styles.logBtn,
                    {
                      backgroundColor: Colors.info,
                      opacity: saving || !weightInput || pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={styles.logBtnText}>{saving ? "..." : "LOG"}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {showBenny && <BennyBubble text={bennyMsg} mood={bennyMood} />}

        {sorted.length >= 2 && (
          <View style={styles.graphCard}>
            <Text style={styles.graphTitle}>WEIGHT OVER TIME</Text>
            <WeightGraph entries={sorted} width={Math.min(320, 360)} height={160} />
          </View>
        )}

        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="scale-bathroom" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>NO ENTRIES YET</Text>
            <Text style={styles.emptyText}>
              Log your weight each morning. Benny will obsessively track every decimal.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.historyHeader}>HISTORY</Text>
            {[...sorted].reverse().map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={[styles.historyWeight, { color: Colors.info }]}>
                  {entry.weight} lbs
                </Text>
              </View>
            ))}
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
  pageTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  topDate: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  logCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.info + "33",
  },
  logLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  weightInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  lbsLabel: { fontSize: 14, color: Colors.textMuted, fontFamily: "Inter_600SemiBold" },
  logBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20 },
  logBtnText: { color: "#fff", fontWeight: "700", fontFamily: "Inter_700Bold", fontSize: 15 },
  todayLogged: { flexDirection: "row", alignItems: "center", gap: 12 },
  todayLoggedLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  todayWeight: { fontSize: 32, fontWeight: "700", fontFamily: "Inter_700Bold" },
  graphCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  graphTitle: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 12 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.textSecondary, letterSpacing: 2 },
  emptyText: { fontSize: 13, color: Colors.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  historyHeader: { fontSize: 10, color: Colors.textMuted, letterSpacing: 2, fontFamily: "Inter_700Bold", marginBottom: 8 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyDate: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  historyWeight: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
