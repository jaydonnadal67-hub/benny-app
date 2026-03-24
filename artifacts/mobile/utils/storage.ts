import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  WorkoutSession,
  NutritionDay,
  CheckIn,
  CardioSession,
  WeightEntry,
  UserProfile,
  BennyMemory,
  Achievement,
  CustomWorkoutDay,
  SleepEntry,
} from "@/types";

const KEYS = {
  history: "liftlog:history",
  nutrition: (date: string) => `liftlog:nutrition:${date}`,
  checkin: (date: string) => `liftlog:checkin:${date}`,
  cardio: "liftlog:cardio",
  weights: "liftlog:weights",
  weeklyReportShown: (week: string) => `liftlog:report:${week}`,
  userProfile: "liftlog:userProfile",
  memories: "liftlog:memories",
  achievements: "liftlog:achievements",
  badDayState: "liftlog:badDayState",
  customWorkouts: "liftlog:customWorkouts",
  sleep: "liftlog:sleep",
};

export function todayKey(): string {
  return new Date().toDateString();
}

export function getWeekKey(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  return `${monday.getFullYear()}-W${monday.toDateString()}`;
}

export async function loadHistory(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.history);
    return raw ? (JSON.parse(raw) as WorkoutSession[]) : [];
  } catch {
    return [];
  }
}

export async function saveHistory(sessions: WorkoutSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.history, JSON.stringify(sessions));
  } catch {}
}

export async function loadNutrition(date: string): Promise<NutritionDay> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.nutrition(date));
    return raw ? (JSON.parse(raw) as NutritionDay) : { date, meals: [], water: 0 };
  } catch {
    return { date, meals: [], water: 0 };
  }
}

export async function saveNutrition(nutrition: NutritionDay): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.nutrition(nutrition.date), JSON.stringify(nutrition));
  } catch {}
}

export async function loadCheckin(date: string): Promise<CheckIn | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.checkin(date));
    return raw ? (JSON.parse(raw) as CheckIn) : null;
  } catch {
    return null;
  }
}

export async function saveCheckin(checkin: CheckIn): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.checkin(checkin.date), JSON.stringify(checkin));
  } catch {}
}

export async function loadCardio(): Promise<CardioSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.cardio);
    return raw ? (JSON.parse(raw) as CardioSession[]) : [];
  } catch {
    return [];
  }
}

export async function saveCardio(sessions: CardioSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.cardio, JSON.stringify(sessions));
  } catch {}
}

export async function loadWeights(): Promise<WeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.weights);
    return raw ? (JSON.parse(raw) as WeightEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveWeights(entries: WeightEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.weights, JSON.stringify(entries));
  } catch {}
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.userProfile);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.userProfile, JSON.stringify(profile));
  } catch {}
}

export async function loadMemories(): Promise<BennyMemory[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.memories);
    return raw ? (JSON.parse(raw) as BennyMemory[]) : [];
  } catch {
    return [];
  }
}

export async function saveMemories(memories: BennyMemory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.memories, JSON.stringify(memories));
  } catch {}
}

export async function loadAchievements(): Promise<Achievement[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.achievements);
    return raw ? (JSON.parse(raw) as Achievement[]) : [];
  } catch {
    return [];
  }
}

export async function saveAchievements(achievements: Achievement[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.achievements, JSON.stringify(achievements));
  } catch {}
}

export async function loadCustomWorkouts(): Promise<CustomWorkoutDay[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.customWorkouts);
    return raw ? (JSON.parse(raw) as CustomWorkoutDay[]) : [];
  } catch {
    return [];
  }
}

export async function saveCustomWorkouts(workouts: CustomWorkoutDay[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.customWorkouts, JSON.stringify(workouts));
  } catch {}
}

export async function loadSleepEntries(): Promise<SleepEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.sleep);
    return raw ? (JSON.parse(raw) as SleepEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveSleepEntries(entries: SleepEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.sleep, JSON.stringify(entries));
  } catch {}
}

export function calcHoursSlept(bedtime: string, wakeTime: string): number {
  const [bH, bM] = bedtime.split(":").map(Number);
  const [wH, wM] = wakeTime.split(":").map(Number);
  let bedMins = bH * 60 + bM;
  let wakeMins = wH * 60 + wM;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return Math.round(((wakeMins - bedMins) / 60) * 10) / 10;
}

export function sleepToCheckinRating(hoursSlept: number): number {
  if (hoursSlept < 5) return 1;
  if (hoursSlept < 6) return 2;
  if (hoursSlept < 7) return 3;
  if (hoursSlept < 8) return 4;
  return 5;
}

type BadDayState = {
  lastBadDay: string;
  isBadDay: boolean;
};

export async function checkAndSetBadDay(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.badDayState);
    const state: BadDayState = raw
      ? JSON.parse(raw)
      : { lastBadDay: "", isBadDay: false };

    const today = todayKey();

    if (state.lastBadDay === today) {
      return state.isBadDay;
    }

    const daysSinceLastBad = state.lastBadDay
      ? Math.floor(
          (Date.now() - new Date(state.lastBadDay).getTime()) / 86400000,
        )
      : 999;

    const shouldBeBadDay =
      daysSinceLastBad >= 10 && Math.random() < 0.12;

    const newState: BadDayState = {
      lastBadDay: shouldBeBadDay ? today : state.lastBadDay,
      isBadDay: shouldBeBadDay,
    };

    await AsyncStorage.setItem(KEYS.badDayState, JSON.stringify(newState));
    return shouldBeBadDay;
  } catch {
    return false;
  }
}

export async function markWeeklyReportShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.weeklyReportShown(getWeekKey()), "true");
  } catch {}
}

export async function wasWeeklyReportShownThisWeek(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.weeklyReportShown(getWeekKey()));
    return val === "true";
  } catch {
    return false;
  }
}

export function computeStreak(history: WorkoutSession[]): number {
  const sessionDates = new Set(
    history.map((s) => new Date(s.date).toDateString()),
  );
  const today = new Date();
  const todayStr = today.toDateString();
  const skipToday = !sessionDates.has(todayStr);
  let daysBack = skipToday ? 1 : 0;
  let streak = 0;

  while (daysBack < 365) {
    const d = new Date(today);
    d.setDate(today.getDate() - daysBack);
    if (sessionDates.has(d.toDateString())) {
      streak++;
    } else {
      break;
    }
    daysBack++;
  }
  return streak;
}

export function computeBennyMood(
  history: WorkoutSession[],
): import("@/types").BennyMoodType {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const thisWeek = history.filter((s) => new Date(s.date) >= monday).length;
  const streak = computeStreak(history);

  if (thisWeek >= 4) return "zoomies";
  if (thisWeek >= 2) return "impressed";
  if (thisWeek >= 1) return "neutral";
  if (thisWeek === 0 && streak === 0 && dayOfWeek >= 5) return "devastated";
  if (thisWeek === 0 && dayOfWeek >= 3) return "disappointed";
  return "neutral";
}

export function getWorstWorkouts(history: WorkoutSession[], count = 3): WorkoutSession[] {
  return [...history]
    .filter((s) => s.totalSets > 0)
    .sort((a, b) => {
      const scoreA = a.totalVolume + a.totalSets * 100;
      const scoreB = b.totalVolume + b.totalSets * 100;
      return scoreA - scoreB;
    })
    .slice(0, count);
}

export function checkAchievements(
  history: WorkoutSession[],
  unlocked: Achievement[],
): string[] {
  const unlockedIds = new Set(unlocked.map((a) => a.id));
  const newlyUnlocked: string[] = [];
  const now = new Date();
  const hour = now.getHours();

  if (!unlockedIds.has("first_workout") && history.length >= 1) {
    newlyUnlocked.push("first_workout");
  }
  if (!unlockedIds.has("streak_7") && computeStreak(history) >= 7) {
    newlyUnlocked.push("streak_7");
  }
  if (!unlockedIds.has("streak_30") && computeStreak(history) >= 30) {
    newlyUnlocked.push("streak_30");
  }
  if (!unlockedIds.has("century") && history.length >= 100) {
    newlyUnlocked.push("century");
  }
  if (!unlockedIds.has("night_owl") && history.some(() => hour >= 21)) {
    newlyUnlocked.push("night_owl");
  }
  if (!unlockedIds.has("early_bird") && hour < 7 && history.length >= 3) {
    newlyUnlocked.push("early_bird");
  }
  const returnerCheck =
    history.length >= 2 &&
    (() => {
      const sorted = [...history].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      for (let i = 1; i < sorted.length; i++) {
        const gap = Math.floor(
          (new Date(sorted[i].date).getTime() -
            new Date(sorted[i - 1].date).getTime()) /
            86400000,
        );
        if (gap >= 5) return true;
      }
      return false;
    })();
  if (!unlockedIds.has("the_returner") && returnerCheck) {
    newlyUnlocked.push("the_returner");
  }

  return newlyUnlocked;
}
