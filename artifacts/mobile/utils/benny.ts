import type { BennyMood } from "@/types";
import { getDeviceToken } from "./security";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || "";

export async function askBenny(
  prompt: string,
  type: "checkin" | "workout" | "nutrition" | "greeting" | "cardio",
  creatorToken?: string,
): Promise<{ message: string; mood: BennyMood }> {
  try {
    const url = `https://${DOMAIN}/api/benny/ask`;
    const token = await getDeviceToken();
    const body: Record<string, unknown> = { prompt, type };
    if (creatorToken) body.creatorToken = creatorToken;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Token": token,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      const data = (await res.json()) as { rateLimited?: boolean; message?: string };
      if (data.rateLimited) {
        return {
          message: data.message ?? "I've been talking all day. I'm a dachshund. I have limits. Come back tomorrow.",
          mood: "neutral",
        };
      }
    }

    if (!res.ok) throw new Error("API error");
    const data = (await res.json()) as { message: string; mood: BennyMood };
    return data;
  } catch {
    const fallbacks: Record<string, { message: string; mood: BennyMood }> = {
      checkin: {
        message: "*tilts head sideways* Something went wrong but I still believe in you. Barely.",
        mood: "checkin",
      },
      workout: {
        message: "*sniffs shoes disapprovingly and walks away*",
        mood: "bad",
      },
      nutrition: {
        message: "*confused barking* My wifi went out. Eat your protein though.",
        mood: "food",
      },
      greeting: {
        message: "*yawns and stretches tiny legs* You showed up. Impressive. Now let's go.",
        mood: "neutral",
      },
      cardio: {
        message: "*runs in tiny circles* Can't connect to the server but your legs still work. Use them.",
        mood: "cardio",
      },
    };
    return fallbacks[type] ?? fallbacks.greeting;
  }
}

export type GeneratedExercise = {
  name: string;
  sets: number;
  reps: string;
  bennyComment: string;
};

export type GeneratedWorkout = {
  name: string;
  bennyIntro: string;
  exercises: GeneratedExercise[];
};

export async function generateBennyWorkout(
  prompt: string,
  recentHistory?: string,
  creatorToken?: string,
): Promise<GeneratedWorkout | null> {
  try {
    const url = `https://${DOMAIN}/api/benny/generate-workout`;
    const token = await getDeviceToken();
    const body: Record<string, unknown> = { prompt };
    if (recentHistory) body.recentHistory = recentHistory;
    if (creatorToken) body.creatorToken = creatorToken;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Token": token,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("API error");
    const data = (await res.json()) as { workout: GeneratedWorkout };
    return data.workout;
  } catch {
    return null;
  }
}

export async function substituteExercise(
  exerciseName: string,
  reason: string,
  workoutContext?: string,
  creatorToken?: string,
): Promise<GeneratedExercise | null> {
  try {
    const url = `https://${DOMAIN}/api/benny/substitute-exercise`;
    const token = await getDeviceToken();
    const body: Record<string, unknown> = { exerciseName, reason };
    if (workoutContext) body.workoutContext = workoutContext;
    if (creatorToken) body.creatorToken = creatorToken;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Token": token,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("API error");
    const data = (await res.json()) as { substitute: GeneratedExercise };
    return data.substitute;
  } catch {
    return null;
  }
}

export async function verifyCreatorPasscode(code: string): Promise<{ valid: boolean; creatorToken?: string }> {
  try {
    const url = `https://${DOMAIN}/api/creator/verify`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: code }),
    });
    if (!res.ok) return { valid: false };
    const data = (await res.json()) as { valid: boolean; creatorToken?: string };
    return data;
  } catch {
    return { valid: false };
  }
}
