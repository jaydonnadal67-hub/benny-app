import { EXERCISE_LIBRARY } from "@/constants/exercises";

export function deriveMuscleGroups(exerciseNames: string[]): string[] {
  const muscles = new Set<string>();

  exerciseNames.forEach((name) => {
    const entry = EXERCISE_LIBRARY.find(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );
    if (entry) {
      entry.muscle.split("/").forEach((m) => muscles.add(m.trim()));
    } else {
      const partial = EXERCISE_LIBRARY.find((e) =>
        name.toLowerCase().includes(e.name.toLowerCase()) ||
        e.name.toLowerCase().includes(name.toLowerCase())
      );
      if (partial) {
        partial.muscle.split("/").forEach((m) => muscles.add(m.trim()));
      }
    }
  });

  return Array.from(muscles);
}

export function formatMuscleGroups(muscleGroups: string[]): string {
  return muscleGroups.join(" · ");
}
