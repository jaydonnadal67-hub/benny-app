export type SetEntry = {
  weight: string;
  reps: string;
  rpe: string;
};

export type ExerciseSets = Record<string, SetEntry[]>;

export type WorkoutSession = {
  id: string;
  day: string;
  date: string;
  exercises: ExerciseSets;
  notes: string;
  bennyQuote?: string;
  totalVolume: number;
  totalSets: number;
  muscleGroups?: string[];
};

export type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type NutritionDay = {
  date: string;
  meals: Meal[];
  water: number;
};

export type CheckIn = {
  date: string;
  energy: number;
  sleep: number;
  stress: number;
  note: string;
  workStatus: string;
  jobSearchUpdate: string;
  skippedReason?: string;
};

export type CardioSession = {
  id: string;
  date: string;
  type: string;
  duration: number;
  notes: string;
  bennyQuote?: string;
  distance?: number;
};

export type WeightEntry = {
  id: string;
  date: string;
  weight: number;
};

export type UserProfile = {
  name?: string;
  birthday?: string;
  why?: string;
  startDate: string;
};

export type BennyMemory = {
  id: string;
  date: string;
  category: "job" | "life" | "achievement" | "struggle" | "goal" | "personal";
  note: string;
  followUpDate?: string;
  followedUp: boolean;
};

export type Achievement = {
  id: string;
  unlockedAt: string;
};

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  bennyReaction: string;
  icon: string;
  color: string;
};

export type CustomWorkoutDay = {
  id: string;
  name: string;
  exercises: string[];
  theme: "push" | "pull" | "legs" | "upper" | "custom";
  isBuiltIn: boolean;
};

export type SleepEntry = {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  hoursSlept: number;
  bennyReaction?: string;
};

export type BennyMoodType = "zoomies" | "impressed" | "neutral" | "disappointed" | "devastated";

export type BennyMood = "good" | "bad" | "neutral" | "food" | "checkin" | "cardio" | "workout";
