import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useApp } from "@/context/AppContext";
import { BennyBubble } from "@/components/BennyBubble";
import { MacroRing } from "@/components/MacroRing";
import { Colors } from "@/constants/colors";
import { GOALS } from "@/constants/workouts";
import { useAskBenny } from "@/utils/useAskBenny";
import { sanitizeInput } from "@/utils/security";
import type { Meal, BennyMood } from "@/types";

type FoodResult = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
};

async function fetchByBarcode(barcode: string): Promise<FoodResult | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
    );
    const data = await res.json();
    if (data.status !== 1) return null;
    const p = data.product;
    const n = p.nutriments || {};
    return {
      id: barcode,
      name: p.product_name || p.abbreviated_product_name || "Unknown Product",
      calories: Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0),
      protein: Math.round((n["proteins_100g"] || 0) * 10) / 10,
      carbs: Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
      fat: Math.round((n["fat_100g"] || 0) * 10) / 10,
      servingSize: p.serving_size || "per 100g",
    };
  } catch {
    return null;
  }
}

async function searchFood(query: string): Promise<FoodResult[]> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=8&fields=code,product_name,nutriments,serving_size`,
    );
    const data = await res.json();
    return (data.products || [])
      .filter((p: any) => p.product_name && p.nutriments?.["energy-kcal_100g"])
      .map((p: any) => ({
        id: p.code || Math.random().toString(),
        name: p.product_name,
        calories: Math.round(p.nutriments["energy-kcal_100g"] || 0),
        protein: Math.round((p.nutriments["proteins_100g"] || 0) * 10) / 10,
        carbs: Math.round((p.nutriments["carbohydrates_100g"] || 0) * 10) / 10,
        fat: Math.round((p.nutriments["fat_100g"] || 0) * 10) / 10,
        servingSize: p.serving_size || "per 100g",
      }));
  } catch {
    return [];
  }
}

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { nutrition, setNutrition, checkin } = useApp();
  const askBenny = useAskBenny();

  const [form, setForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [bennyMsg, setBennyMsg] = useState("");
  const [bennyMood, setBennyMood] = useState<BennyMood>("food");
  const [loadingBenny, setLoadingBenny] = useState(false);
  const [inlineMealMsg, setInlineMealMsg] = useState("");
  const [inlineMealLoading, setInlineMealLoading] = useState(false);
  const [inlineWaterMsg, setInlineWaterMsg] = useState("");
  const [inlineWaterLoading, setInlineWaterLoading] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scannedOnce, setScannedOnce] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);

  const totals = nutrition.meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const fillFromFood = (food: FoodResult) => {
    setForm({
      name: food.name,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
    });
    setSearchResults([]);
    setSearchQuery("");
    setShowScanner(false);
    setScannedOnce(false);
  };

  const handleBarcode = async (data: string) => {
    if (scanLoading) return;
    setScanLoading(true);
    const food = await fetchByBarcode(data);
    if (food) {
      fillFromFood(food);
    } else {
      setScannedOnce(true);
    }
    setScanLoading(false);
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchFood(searchQuery.trim());
    setSearchResults(results);
    setSearching(false);
  };

  const addMeal = async () => {
    if (!form.name || !form.calories) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const meal: Meal = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: sanitizeInput(form.name, "meal"),
      calories: parseInt(form.calories) || 0,
      protein: parseInt(form.protein) || 0,
      carbs: parseInt(form.carbs) || 0,
      fat: parseInt(form.fat) || 0,
    };
    const updated = { ...nutrition, meals: [...nutrition.meals, meal] };
    await setNutrition(updated);
    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "" });

    setInlineMealLoading(true);
    setInlineMealMsg("");

    const newTotalCal = totals.calories + meal.calories;
    const newProtein = totals.protein + meal.protein;
    const jobBit = checkin?.jobSearchUpdate
      ? ` Context: job search: "${checkin.jobSearchUpdate}".`
      : "";

    const prompt = `You are Benny, a sarcastic dachshund fitness coach. React in ONE funny sentence to this meal: ${meal.name} — ${meal.calories} calories, ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fat}g fat. Running total today: ${newTotalCal}/${GOALS.calories} cal, ${newProtein}/${GOALS.protein}g protein.${jobBit} Sarcastic but supportive. No intro.`;
    const { message } = await askBenny(prompt, "nutrition");
    setInlineMealMsg(message);
    setInlineMealLoading(false);
  };

  const removeMeal = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setNutrition({ ...nutrition, meals: nutrition.meals.filter((m) => m.id !== id) });
  };

  const setWater = async (val: number) => {
    const prev = nutrition.water;
    await setNutrition({ ...nutrition, water: val });
    if (val === prev) return;
    setInlineWaterLoading(true);
    setInlineWaterMsg("");
    const prompt = `You are Benny, a sarcastic dachshund. ONE sentence: your owner just ${val > prev ? "drank a glass of water" : "un-logged a glass of water"}. They're at ${val}/${GOALS.water} glasses. ${val >= GOALS.water ? "Shocked approval." : val < 3 ? "Dramatic dehydration panic." : "Mild encouragement."} No intro.`;
    const { message } = await askBenny(prompt, "nutrition");
    setInlineWaterMsg(message);
    setInlineWaterLoading(false);
  };

  const askBennyAboutNutrition = async () => {
    setLoadingBenny(true);
    setBennyMsg("");
    const mealList =
      nutrition.meals
        .map((m) => `${m.name} (${m.calories}cal, P:${m.protein}g, C:${m.carbs}g, F:${m.fat}g)`)
        .join(", ") || "Nothing. Absolutely nothing.";
    const jobBit = checkin?.jobSearchUpdate
      ? ` Life context: job search — "${checkin.jobSearchUpdate}". Work — "${checkin.workStatus || "not mentioned"}".`
      : "";
    const prompt = `You are Benny, a sarcastic dachshund fitness coach. Review my nutrition.
Meals: ${mealList}
Totals: ${totals.calories}cal, ${totals.protein}g protein, ${totals.carbs}g carbs, ${totals.fat}g fat. Water: ${nutrition.water}/8 glasses.
Goals: ${GOALS.calories}cal, ${GOALS.protein}g protein, ${GOALS.carbs}g carbs, ${GOALS.fat}g fat.${jobBit}
Be specific. Roast bad choices, reluctantly praise good ones. If protein low: sigh dramatically. If water low: personally offended. 3-4 sentences.`;
    const { message, mood } = await askBenny(prompt, "nutrition");
    setBennyMsg(message);
    setBennyMood(mood);
    setLoadingBenny(false);
  };

  const calorieOver = totals.calories > GOALS.calories;

  const openScanner = async () => {
    if (Platform.OS === "web") {
      return;
    }
    if (!permission?.granted) {
      await requestPermission();
    }
    setScannedOnce(false);
    setScanLoading(false);
    setShowScanner(true);
  };

  return (
    <View style={styles.screen}>
      <Modal visible={showScanner} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.scannerModal}>
          <View style={styles.scannerHeader}>
            <Pressable onPress={() => setShowScanner(false)} style={styles.backBtn}>
              <Feather name="x" size={22} color={Colors.text} />
            </Pressable>
            <Text style={styles.scannerTitle}>SCAN BARCODE</Text>
            <View style={{ width: 36 }} />
          </View>
          {permission?.granted ? (
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scannedOnce || scanLoading ? undefined : ({ data }) => handleBarcode(data)}
                barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"] }}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
                {scanLoading && (
                  <View style={styles.scanLoading}>
                    <ActivityIndicator color={Colors.success} />
                    <Text style={styles.scanLoadingText}>Looking up product...</Text>
                  </View>
                )}
                {scannedOnce && !scanLoading && (
                  <View style={styles.scanNotFound}>
                    <Text style={styles.scanNotFoundText}>Product not found. Try another barcode.</Text>
                    <Pressable onPress={() => setScannedOnce(false)} style={styles.scanRetryBtn}>
                      <Text style={styles.scanRetryText}>RETRY</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.permissionBox}>
              <Feather name="camera-off" size={48} color={Colors.textMuted} />
              <Text style={styles.permissionText}>Camera access needed to scan barcodes.</Text>
              <Pressable onPress={requestPermission} style={styles.grantBtn}>
                <Text style={styles.grantBtnText}>GRANT CAMERA ACCESS</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      <View style={[styles.topBar, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={[styles.screenTitle, { color: Colors.purple }]}>NUTRITION</Text>
          <Text style={styles.topBarDate}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.calorieCard}>
          <View style={styles.calorieTop}>
            <View>
              <Text style={[styles.calorieNum, { color: calorieOver ? Colors.accent : Colors.text }]}>
                {totals.calories}
              </Text>
              <Text style={styles.calorieGoal}>/ {GOALS.calories} CALORIES</Text>
            </View>
            <View style={styles.calorieRight}>
              <Text style={styles.calorieRemaining}>
                {calorieOver
                  ? `${totals.calories - GOALS.calories} over`
                  : `${GOALS.calories - totals.calories} remaining`}
              </Text>
              <View style={[styles.calorieBar, { backgroundColor: Colors.purple + "22" }]}>
                <View style={[styles.calorieBarFill, {
                  width: `${Math.min((totals.calories / GOALS.calories) * 100, 100)}%`,
                  backgroundColor: calorieOver ? Colors.accent : Colors.purple,
                }]} />
              </View>
            </View>
          </View>
          <View style={styles.macroRings}>
            <MacroRing label="PROTEIN" current={totals.protein} goal={GOALS.protein} color={Colors.accent} />
            <MacroRing label="CARBS" current={totals.carbs} goal={GOALS.carbs} color={Colors.warning} />
            <MacroRing label="FAT" current={totals.fat} goal={GOALS.fat} color={Colors.info} />
          </View>
        </View>

        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Feather name="droplet" size={16} color={Colors.info} />
            <Text style={[styles.waterTitle, { color: Colors.info }]}>WATER INTAKE</Text>
            <Text style={styles.waterCount}>{nutrition.water} / {GOALS.water}</Text>
          </View>
          <View style={styles.waterGlasses}>
            {Array.from({ length: GOALS.water }).map((_, i) => (
              <Pressable
                key={i}
                onPress={() => setWater(i < nutrition.water ? i : i + 1)}
                style={[styles.glass, {
                  backgroundColor: i < nutrition.water ? Colors.info + "33" : "transparent",
                  borderColor: i < nutrition.water ? Colors.info : Colors.border,
                }]}
              >
                <Feather name="droplet" size={14} color={i < nutrition.water ? Colors.info : Colors.border} />
              </Pressable>
            ))}
          </View>
          {(inlineWaterMsg || inlineWaterLoading) && (
            <View style={[styles.inlineBenny, { borderColor: Colors.info + "33", backgroundColor: Colors.info + "0A" }]}>
              <MaterialCommunityIcons name="dog" size={12} color={Colors.info} />
              <Text style={[styles.inlineBennyText, { color: Colors.info }]}>
                {inlineWaterLoading ? "..." : inlineWaterMsg}
              </Text>
            </View>
          )}
          <View style={styles.waterButtons}>
            <Pressable
              onPress={() => setWater(Math.min(nutrition.water + 1, GOALS.water))}
              disabled={nutrition.water >= GOALS.water}
              style={[styles.waterBtn, { backgroundColor: nutrition.water >= GOALS.water ? Colors.border : Colors.info, flex: 1 }]}
            >
              <Text style={styles.waterBtnText}>+ Glass</Text>
            </Pressable>
            <Pressable
              onPress={() => setWater(Math.max(nutrition.water - 1, 0))}
              disabled={nutrition.water <= 0}
              style={[styles.waterBtnOutline, { opacity: nutrition.water <= 0 ? 0.4 : 1 }]}
            >
              <Feather name="minus" size={16} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {(bennyMsg || loadingBenny) && (
          <BennyBubble text={bennyMsg} mood={bennyMood} loading={loadingBenny} />
        )}
        <Pressable
          onPress={askBennyAboutNutrition}
          style={({ pressed }) => [styles.askBennyBtn, { opacity: pressed || loadingBenny ? 0.7 : 1 }]}
        >
          <Feather name="message-square" size={16} color={Colors.warning} />
          <Text style={styles.askBennyText}>
            {loadingBenny ? "BENNY IS SNIFFING YOUR FOOD..." : "ASK BENNY ABOUT MY NUTRITION"}
          </Text>
        </Pressable>

        <View style={styles.logCard}>
          <Text style={styles.logTitle}>LOG A MEAL</Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search food name..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={doSearch}
              returnKeyType="search"
            />
            <Pressable onPress={doSearch} style={[styles.searchBtn, { backgroundColor: Colors.purple }]}>
              {searching
                ? <ActivityIndicator size="small" color="#fff" />
                : <Feather name="search" size={16} color="#fff" />}
            </Pressable>
            {Platform.OS !== "web" && (
              <Pressable onPress={openScanner} style={[styles.searchBtn, { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border }]}>
                <Feather name="camera" size={16} color={Colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((food) => (
                <Pressable
                  key={food.id}
                  onPress={() => fillFromFood(food)}
                  style={styles.searchResultItem}
                >
                  <View style={styles.searchResultLeft}>
                    <Text style={styles.searchResultName} numberOfLines={1}>{food.name}</Text>
                    <Text style={styles.searchResultMeta}>
                      {food.calories} cal · P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g
                    </Text>
                    {food.servingSize && (
                      <Text style={styles.searchResultServing}>{food.servingSize}</Text>
                    )}
                  </View>
                  <Feather name="plus-circle" size={18} color={Colors.purple} />
                </Pressable>
              ))}
              <Pressable onPress={() => setSearchResults([])} style={styles.clearResults}>
                <Text style={styles.clearResultsText}>CLEAR RESULTS</Text>
              </Pressable>
            </View>
          )}

          <TextInput
            style={styles.nameInput}
            placeholder="Meal name"
            placeholderTextColor={Colors.textMuted}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
          <View style={styles.macroInputs}>
            {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
              <TextInput
                key={key}
                style={styles.macroInput}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={form[key]}
                onChangeText={(v) => setForm({ ...form, [key]: v })}
              />
            ))}
          </View>

          {(inlineMealMsg || inlineMealLoading) && (
            <View style={[styles.inlineBenny, { borderColor: Colors.warning + "33", backgroundColor: Colors.warning + "0A", marginBottom: 8 }]}>
              <MaterialCommunityIcons name="dog" size={12} color={Colors.warning} />
              <Text style={[styles.inlineBennyText, { color: Colors.warning }]}>
                {inlineMealLoading ? "Benny is inspecting your food..." : inlineMealMsg}
              </Text>
            </View>
          )}

          <Pressable
            onPress={addMeal}
            disabled={!form.name || !form.calories}
            style={({ pressed }) => [styles.addMealBtn, {
              backgroundColor: Colors.purple,
              opacity: !form.name || !form.calories || pressed ? 0.6 : 1,
            }]}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addMealText}>ADD MEAL</Text>
          </Pressable>
        </View>

        {nutrition.meals.length > 0 && (
          <View>
            <Text style={styles.mealsHeader}>TODAY'S MEALS</Text>
            {nutrition.meals.map((meal) => (
              <View key={meal.id} style={styles.mealRow}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealMacros}>
                    {meal.calories} cal · P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g
                  </Text>
                </View>
                <Pressable onPress={() => removeMeal(meal.id)} style={styles.removeMealBtn}>
                  <Feather name="x" size={14} color={Colors.accent + "88"} />
                </Pressable>
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
  scannerModal: { flex: 1, backgroundColor: "#000" },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.bg,
  },
  scannerTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2 },
  cameraWrap: { flex: 1, position: "relative" },
  camera: { flex: 1 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  scanLoading: {
    position: "absolute",
    bottom: 80,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scanLoadingText: { color: "#fff", fontFamily: "Inter_400Regular", fontSize: 13 },
  scanNotFound: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
    gap: 10,
  },
  scanNotFoundText: {
    color: Colors.warning,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 10,
    borderRadius: 8,
  },
  scanRetryBtn: { backgroundColor: Colors.warning, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 20 },
  scanRetryText: { color: "#000", fontWeight: "700", fontFamily: "Inter_700Bold" },
  permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 40, backgroundColor: Colors.bg },
  permissionText: { color: Colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", fontSize: 14 },
  grantBtn: { backgroundColor: Colors.success, borderRadius: 12, padding: 14 },
  grantBtnText: { color: "#fff", fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  topBarCenter: { alignItems: "center" },
  screenTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 2 },
  topBarDate: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  calorieCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.purple + "44",
  },
  calorieTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  calorieNum: { fontSize: 40, fontWeight: "700", fontFamily: "Inter_700Bold", lineHeight: 44 },
  calorieGoal: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginTop: 2 },
  calorieRight: { alignItems: "flex-end", flex: 1, marginLeft: 12 },
  calorieRemaining: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 8 },
  calorieBar: { width: "100%", height: 4, borderRadius: 2, overflow: "hidden" },
  calorieBarFill: { height: "100%", borderRadius: 2 },
  macroRings: { flexDirection: "row", gap: 8 },
  waterCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.info + "33",
  },
  waterHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  waterTitle: { flex: 1, fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  waterCount: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  waterGlasses: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  glass: {
    width: 34, height: 40, borderRadius: 8, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  inlineBenny: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  inlineBennyText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  waterButtons: { flexDirection: "row", gap: 8 },
  waterBtn: { padding: 10, borderRadius: 10, alignItems: "center" },
  waterBtnText: { color: "#fff", fontWeight: "700", fontFamily: "Inter_700Bold", fontSize: 14 },
  waterBtnOutline: {
    padding: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center", width: 44,
  },
  askBennyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + "44",
    backgroundColor: Colors.warning + "0A",
    marginBottom: 12,
  },
  askBennyText: { color: Colors.warning, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  logCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.purple + "22",
  },
  logTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", color: Colors.purple, letterSpacing: 1, marginBottom: 12 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchResults: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchResultLeft: { flex: 1, marginRight: 8 },
  searchResultName: { color: Colors.text, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  searchResultMeta: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 1 },
  searchResultServing: { fontSize: 10, color: Colors.textMuted + "88", fontFamily: "Inter_400Regular", marginTop: 1 },
  clearResults: { padding: 10, alignItems: "center" },
  clearResultsText: { fontSize: 10, color: Colors.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  nameInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  macroInputs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  macroInput: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  addMealBtn: {
    borderRadius: 12, padding: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  addMealText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
  mealsHeader: { fontSize: 11, color: Colors.textMuted, letterSpacing: 2, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealInfo: { flex: 1 },
  mealName: { color: Colors.text, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  mealMacros: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  removeMealBtn: {
    width: 28, height: 28, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accent + "15", borderRadius: 6,
  },
});
