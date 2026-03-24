import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";

const GOLD = "#F5C518";

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { signOutCreator, isCreator } = useApp();

  useEffect(() => {
    if (!isCreator) {
      router.replace("/");
    }
  }, [isCreator]);

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOutCreator();
    router.back();
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="paw" size={16} color={GOLD} />
          <Text style={styles.pageTitle}>ADMIN PANEL</Text>
          <MaterialCommunityIcons name="paw" size={16} color={GOLD} />
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
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MEET BENNY SUBMISSIONS</Text>

          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="paw" size={32} color={GOLD + "55"} />
            <Text style={styles.emptyTitle}>Nothing here yet.</Text>
            <Text style={styles.emptyText}>
              I've been sitting by the door waiting for submissions and there is nothing. Not one thing. Gerald probably ate them. This section will fill up when real humans start submitting their Meet Benny moments. For now I'm just here. Waiting. Being very patient about it.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="log-out" size={16} color={Colors.accent} />
          <Text style={styles.signOutText}>SIGN OUT OF CREATOR MODE</Text>
        </Pressable>
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
    borderBottomWidth: 1,
    borderBottomColor: GOLD + "22",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 2,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24 },
  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD + "22",
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    color: GOLD,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlign: "center",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.accent + "44",
    borderRadius: 14,
    padding: 16,
    backgroundColor: Colors.accent + "0A",
  },
  signOutText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
});
