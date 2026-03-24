import type { UserProfile, BennyMemory, WorkoutSession, NutritionDay, CheckIn } from "@/types";
import type { BennyMoodType } from "@/types";
import { computeStreak } from "./storage";

export type BennyPersonalityMode =
  | "tired"
  | "dream"
  | "birthday"
  | "holiday"
  | "bad_day"
  | "high_stress"
  | "normal";

export type BennyContextData = {
  profile: UserProfile | null;
  memories: BennyMemory[];
  history: WorkoutSession[];
  checkin: CheckIn | null;
  nutrition: NutritionDay;
  streak: number;
  geraldPoints: number;
  isBadDay: boolean;
  achievements: string[];
};

function detectHoliday(date: Date): string | null {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dow = date.getDay();
  if (m === 1 && d === 1) return "New Year's Day";
  if (m === 2 && d === 14) return "Valentine's Day";
  if (m === 7 && d === 4) return "Fourth of July";
  if (m === 10 && d === 31) return "Halloween";
  if (m === 12 && d === 25) return "Christmas Day";
  if (m === 12 && d === 24) return "Christmas Eve";
  if (m === 12 && d === 31) return "New Year's Eve";
  if (m === 11 && dow === 4) {
    const weekOfMonth = Math.ceil(d / 7);
    if (weekOfMonth === 4) return "Thanksgiving";
  }
  return null;
}

function getCoachingLevel(startDate: string | undefined): string {
  if (!startDate) return "warming_up";
  const days = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
  if (days < 7) return "new";
  if (days < 21) return "warming_up";
  if (days < 90) return "best_friend";
  return "legendary";
}

function getCoachingLevelDesc(level: string): string {
  switch (level) {
    case "new":
      return "Professional, still learning the user. More formal, less personal.";
    case "warming_up":
      return "Getting comfortable. More jokes, starting to feel personal. Still warming up.";
    case "best_friend":
      return "Full unhinged best friend mode. Says whatever he wants. Knows the user well.";
    case "legendary":
      return "Deeply invested. Occasionally forgets to be sarcastic and has to correct himself. References shared history.";
    default:
      return "Normal Benny mode.";
  }
}

export function buildBennyContext(data: BennyContextData): string {
  const now = new Date();
  const hour = now.getHours();
  const isTired = hour >= 22 || hour < 6;
  const isDream = hour >= 4 && hour < 7;
  const holiday = detectHoliday(now);
  const coachingLevel = getCoachingLevel(data.profile?.startDate);

  const isBirthday =
    data.profile?.birthday &&
    (() => {
      const b = new Date(data.profile!.birthday!);
      return (
        b.getMonth() === now.getMonth() && b.getDate() === now.getDate()
      );
    })();

  const birthYear = data.profile?.birthday
    ? new Date(data.profile.birthday).getFullYear()
    : null;
  const age = birthYear ? now.getFullYear() - birthYear : null;

  const pendingMemories = data.memories.filter(
    (m) =>
      !m.followedUp &&
      m.followUpDate &&
      new Date(m.followUpDate) <= now,
  );

  const geraldStatus =
    data.geraldPoints > 5
      ? "absolutely thriving (user has been slacking badly)"
      : data.geraldPoints > 2
        ? "gaining strength (mixed week)"
        : data.geraldPoints < -4
          ? "utterly defeated (user is crushing it)"
          : data.geraldPoints < -1
            ? "losing ground (user is doing well)"
            : "watching and waiting";

  const recentStress =
    data.checkin?.stress && data.checkin.stress >= 4;

  let ctx = `\n=== BENNY'S PERSONALITY CONTEXT ===\n`;

  ctx += `COACHING LEVEL: ${coachingLevel} — ${getCoachingLevelDesc(coachingLevel)}\n`;

  ctx += `BENNY'S NEMESIS: Gerald is a fictional lazy cat representing bad habits. Gerald is currently ${geraldStatus}. Reference Gerald when appropriate (laziness, skipped workouts, junk food).\n`;

  ctx += `BENNY'S FAVORITES: Deadlifts are his favorite exercise and he gets visibly excited about them. He despises burpees with his entire tiny body.\n`;

  if (isBirthday && age) {
    ctx += `🎂 TODAY IS THE USER'S BIRTHDAY (turning ${age})! Benny goes completely unhinged. Over-the-top dramatic celebration. Still expects them to work out. Makes age-related comments.\n`;
  }

  if (holiday) {
    const holidayGuide: Record<string, string> = {
      "Thanksgiving":
        "Benny is HORRIFIED by the calorie intake happening today. Still supportive, mostly panicking.",
      "New Year's Day":
        "Benny is deeply skeptical of New Year's resolutions but willing to give one shot. Sarcasm level: maximum.",
      "Valentine's Day":
        "Benny makes fun of them unless they're at the gym, in which case he's ironically proud.",
      "Christmas Day":
        "Surprisingly wholesome Benny. Still sarcastic, but with genuine holiday warmth underneath.",
      "Christmas Eve":
        "Benny is distracted by the holiday and mildly flustered.",
      "Fourth of July":
        "Benny relates fireworks to explosive lifts somehow. American gym energy.",
      "Halloween":
        "Benny is concerned about candy consumption. Very concerned.",
      "New Year's Eve":
        "Benny is reflective about the year. What did we accomplish? More than Gerald, at least.",
    };
    ctx += `HOLIDAY: It's ${holiday}. ${holidayGuide[holiday] || `Benny reacts appropriately to ${holiday}.`}\n`;
  }

  if (data.isBadDay) {
    ctx += `BENNY IS HAVING A BAD DAY: He's mopey, sighing a lot, barely coaching. Still shows up. Never explains why. Just clearly off. Kind of wholesome actually.\n`;
  }

  if (isTired) {
    ctx += `BENNY IS HALF ASLEEP: It's ${hour}:00 and he's furious about being awake. Grumpy, yawning, questioning life choices. Still helps but with maximum reluctance and obvious drowsiness. "Why are you here. Go to bed."\n`;
  } else if (isDream && !isTired) {
    ctx += `EARLY MORNING: It's before 7am. Benny just woke up from a bizarre fitness-related dream. Before anything else, briefly share this absurd dream. Always fitness-related, always strange. "I dreamed you finally hit 225 on bench but the plates were made of brie cheese..."\n`;
  }

  if (recentStress) {
    ctx += `HIGH STRESS DETECTED: Stress score is ${data.checkin?.stress}/5. If stress has been consistently high, DROP THE SARCASM. Genuine check-in. Real warmth. "Are you okay?" energy. Make it feel human.\n`;
  }

  if (pendingMemories.length > 0) {
    ctx += `MEMORIES TO BRING UP NATURALLY: ${pendingMemories.map((m) => m.note).join("; ")}. Don't announce you're bringing them up — just reference them as if you remembered.\n`;
  }

  if (data.profile?.why) {
    ctx += `USER'S WHY (their reason for training): "${data.profile.why}" — reference this at emotional moments.\n`;
  }

  if (data.profile?.name) {
    ctx += `USER'S NAME: ${data.profile.name}. Use occasionally, not every message.\n`;
  }

  ctx += `=== END CONTEXT ===\n\n`;

  return ctx;
}

export function getPersonalityMode(
  profile: UserProfile | null,
  isBadDay: boolean,
  checkin: CheckIn | null,
): BennyPersonalityMode {
  const now = new Date();
  const hour = now.getHours();

  if (
    profile?.birthday &&
    (() => {
      const b = new Date(profile.birthday!);
      return b.getMonth() === now.getMonth() && b.getDate() === now.getDate();
    })()
  )
    return "birthday";

  if (detectHoliday(now)) return "holiday";

  if (hour >= 22 || hour < 6) return "tired";

  if (hour >= 4 && hour < 7) return "dream";

  if (isBadDay) return "bad_day";

  if (checkin?.stress && checkin.stress >= 4) return "high_stress";

  return "normal";
}

export function computeGeraldPoints(history: WorkoutSession[]): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const thisWeek = history.filter((s) => new Date(s.date) >= monday).length;
  const expectedByNow = Math.min(dayOfWeek || 7, 4);
  const deficit = Math.max(0, expectedByNow - thisWeek);

  return deficit - thisWeek;
}
