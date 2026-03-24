import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
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
  BennyMoodType,
} from "@/types";
import {
  loadHistory,
  saveHistory,
  loadNutrition,
  saveNutrition,
  loadCheckin,
  saveCheckin,
  loadCardio,
  saveCardio,
  loadWeights,
  saveWeights,
  loadUserProfile,
  saveUserProfile,
  loadMemories,
  saveMemories,
  loadAchievements,
  saveAchievements,
  loadCustomWorkouts,
  saveCustomWorkouts,
  loadSleepEntries,
  saveSleepEntries,
  computeStreak,
  computeBennyMood,
  checkAndSetBadDay,
  checkAchievements,
  todayKey,
} from "@/utils/storage";
import { computeGeraldPoints } from "@/utils/bennyContext";

const CREATOR_STORAGE_KEY = "liftlog:isCreator";
const CREATOR_TOKEN_KEY = "liftlog:creatorToken";

type AppContextType = {
  history: WorkoutSession[];
  addSession: (session: WorkoutSession) => Promise<string[]>;
  nutrition: NutritionDay;
  setNutrition: (n: NutritionDay) => Promise<void>;
  checkin: CheckIn | null;
  setCheckin: (c: CheckIn) => Promise<void>;
  cardio: CardioSession[];
  addCardio: (session: CardioSession) => Promise<void>;
  weights: WeightEntry[];
  addWeight: (entry: WeightEntry) => Promise<void>;
  userProfile: UserProfile | null;
  setUserProfile: (p: UserProfile) => Promise<void>;
  memories: BennyMemory[];
  addMemory: (m: BennyMemory) => Promise<void>;
  markMemoryFollowedUp: (id: string) => Promise<void>;
  achievements: Achievement[];
  unlockAchievement: (id: string) => Promise<void>;
  customWorkouts: CustomWorkoutDay[];
  saveCustomWorkout: (w: CustomWorkoutDay) => Promise<void>;
  deleteCustomWorkout: (id: string) => Promise<void>;
  sleepEntries: SleepEntry[];
  addSleepEntry: (entry: SleepEntry) => Promise<void>;
  todaySleep: SleepEntry | null;
  streak: number;
  bennyMoodState: BennyMoodType;
  geraldPoints: number;
  isBadDay: boolean;
  isLoaded: boolean;
  isCreator: boolean;
  creatorToken: string;
  unlockCreator: (token: string) => Promise<void>;
  signOutCreator: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const today = todayKey();
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [nutrition, setNutritionState] = useState<NutritionDay>({ date: today, meals: [], water: 0 });
  const [checkin, setCheckinState] = useState<CheckIn | null>(null);
  const [cardio, setCardioState] = useState<CardioSession[]>([]);
  const [weights, setWeightsState] = useState<WeightEntry[]>([]);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [memories, setMemoriesState] = useState<BennyMemory[]>([]);
  const [achievements, setAchievementsState] = useState<Achievement[]>([]);
  const [customWorkouts, setCustomWorkoutsState] = useState<CustomWorkoutDay[]>([]);
  const [sleepEntries, setSleepEntriesState] = useState<SleepEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [bennyMoodState, setBennyMoodState] = useState<BennyMoodType>("neutral");
  const [geraldPoints, setGeraldPoints] = useState(0);
  const [isBadDay, setIsBadDay] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorToken, setCreatorToken] = useState("");

  useEffect(() => {
    async function init() {
      const [h, n, c, card, w, profile, mems, achs, custom, sleep, badDay, creatorVal, tokenVal] = await Promise.all([
        loadHistory(),
        loadNutrition(today),
        loadCheckin(today),
        loadCardio(),
        loadWeights(),
        loadUserProfile(),
        loadMemories(),
        loadAchievements(),
        loadCustomWorkouts(),
        loadSleepEntries(),
        checkAndSetBadDay(),
        AsyncStorage.getItem(CREATOR_STORAGE_KEY),
        AsyncStorage.getItem(CREATOR_TOKEN_KEY),
      ]);

      if (!profile) {
        const newProfile: UserProfile = { startDate: new Date().toISOString() };
        await saveUserProfile(newProfile);
        setUserProfileState(newProfile);
      } else {
        setUserProfileState(profile);
      }

      setHistory(h);
      setNutritionState(n);
      setCheckinState(c);
      setCardioState(card);
      setWeightsState(w);
      setMemoriesState(mems);
      setAchievementsState(achs);
      setCustomWorkoutsState(custom);
      setSleepEntriesState(sleep);
      setStreak(computeStreak(h));
      setBennyMoodState(computeBennyMood(h));
      setGeraldPoints(computeGeraldPoints(h));
      setIsBadDay(badDay);
      setIsCreator(creatorVal === "true");
      setCreatorToken(tokenVal ?? "");
      setIsLoaded(true);
    }
    init();
  }, [today]);

  const addSession = useCallback(
    async (session: WorkoutSession): Promise<string[]> => {
      const updated = [...history, session];
      setHistory(updated);
      setStreak(computeStreak(updated));
      setBennyMoodState(computeBennyMood(updated));
      setGeraldPoints(computeGeraldPoints(updated));
      await saveHistory(updated);
      const newBadges = checkAchievements(updated, achievements);
      if (newBadges.length > 0) {
        const newAchs = [
          ...achievements,
          ...newBadges.map((id) => ({ id, unlockedAt: new Date().toISOString() })),
        ];
        setAchievementsState(newAchs);
        await saveAchievements(newAchs);
      }
      return newBadges;
    },
    [history, achievements],
  );

  const setNutrition = useCallback(async (n: NutritionDay) => {
    setNutritionState(n);
    await saveNutrition(n);
  }, []);

  const setCheckin = useCallback(async (c: CheckIn) => {
    setCheckinState(c);
    await saveCheckin(c);
  }, []);

  const addCardio = useCallback(
    async (session: CardioSession) => {
      const updated = [session, ...cardio];
      setCardioState(updated);
      await saveCardio(updated);
    },
    [cardio],
  );

  const addWeight = useCallback(
    async (entry: WeightEntry) => {
      const updated = [entry, ...weights.filter((w) => w.date !== entry.date)];
      setWeightsState(updated);
      await saveWeights(updated);
    },
    [weights],
  );

  const setUserProfile = useCallback(async (p: UserProfile) => {
    setUserProfileState(p);
    await saveUserProfile(p);
  }, []);

  const addMemory = useCallback(
    async (m: BennyMemory) => {
      const updated = [m, ...memories].slice(0, 50);
      setMemoriesState(updated);
      await saveMemories(updated);
    },
    [memories],
  );

  const markMemoryFollowedUp = useCallback(
    async (id: string) => {
      const updated = memories.map((m) =>
        m.id === id ? { ...m, followedUp: true } : m,
      );
      setMemoriesState(updated);
      await saveMemories(updated);
    },
    [memories],
  );

  const unlockAchievement = useCallback(
    async (id: string) => {
      if (achievements.some((a) => a.id === id)) return;
      const updated = [...achievements, { id, unlockedAt: new Date().toISOString() }];
      setAchievementsState(updated);
      await saveAchievements(updated);
    },
    [achievements],
  );

  const saveCustomWorkout = useCallback(
    async (w: CustomWorkoutDay) => {
      const existing = customWorkouts.findIndex((c) => c.id === w.id);
      const updated =
        existing >= 0
          ? customWorkouts.map((c) => (c.id === w.id ? w : c))
          : [...customWorkouts, w];
      setCustomWorkoutsState(updated);
      await saveCustomWorkouts(updated);
    },
    [customWorkouts],
  );

  const deleteCustomWorkout = useCallback(
    async (id: string) => {
      const updated = customWorkouts.filter((c) => c.id !== id);
      setCustomWorkoutsState(updated);
      await saveCustomWorkouts(updated);
    },
    [customWorkouts],
  );

  const addSleepEntry = useCallback(
    async (entry: SleepEntry) => {
      const updated = [entry, ...sleepEntries.filter((s) => s.date !== entry.date)];
      setSleepEntriesState(updated);
      await saveSleepEntries(updated);
    },
    [sleepEntries],
  );

  const unlockCreator = useCallback(async (token: string) => {
    await Promise.all([
      AsyncStorage.setItem(CREATOR_STORAGE_KEY, "true"),
      AsyncStorage.setItem(CREATOR_TOKEN_KEY, token),
    ]);
    setIsCreator(true);
    setCreatorToken(token);
  }, []);

  const signOutCreator = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(CREATOR_STORAGE_KEY),
      AsyncStorage.removeItem(CREATOR_TOKEN_KEY),
    ]);
    setIsCreator(false);
    setCreatorToken("");
  }, []);

  const todaySleep = sleepEntries.find((s) => s.date === today) ?? null;

  return (
    <AppContext.Provider
      value={{
        history,
        addSession,
        nutrition,
        setNutrition,
        checkin,
        setCheckin,
        cardio,
        addCardio,
        weights,
        addWeight,
        userProfile,
        setUserProfile,
        memories,
        addMemory,
        markMemoryFollowedUp,
        achievements,
        unlockAchievement,
        customWorkouts,
        saveCustomWorkout,
        deleteCustomWorkout,
        sleepEntries,
        addSleepEntry,
        todaySleep,
        streak,
        bennyMoodState,
        geraldPoints,
        isBadDay,
        isLoaded,
        isCreator,
        creatorToken,
        unlockCreator,
        signOutCreator,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
