export const WORKOUTS = {
  "Day 1 — Push": [
    "Barbell Bench Press",
    "Incline Dumbbell Press",
    "Cable Lateral Raises",
    "Overhead Dumbbell Press",
    "Tricep Rope Pushdown",
    "Overhead Cable Tricep Extension",
  ],
  "Day 2 — Pull": [
    "Weighted Pull-Ups",
    "Barbell Row",
    "Seated Cable Row",
    "Lat Pulldown",
    "Incline Dumbbell Curl",
    "Hammer Curls",
  ],
  "Day 3 — Legs": [
    "Barbell Back Squat",
    "Romanian Deadlift",
    "Leg Press",
    "Walking Lunges",
    "Leg Curl",
    "Standing Calf Raise",
  ],
  "Day 4 — Upper": [
    "Overhead Press",
    "Dumbbell Chest Fly",
    "Single Arm Dumbbell Row",
    "Face Pulls",
    "EZ Bar Curl",
    "Skull Crushers",
  ],
} as const;

export type WorkoutDay = keyof typeof WORKOUTS;

export const DAY_THEMES = {
  "Day 1 — Push": "push",
  "Day 2 — Pull": "pull",
  "Day 3 — Legs": "legs",
  "Day 4 — Upper": "upper",
} as const;

export const GOALS = {
  calories: 2400,
  protein: 178,
  carbs: 220,
  fat: 65,
  water: 8,
} as const;
