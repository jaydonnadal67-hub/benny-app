import { useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { askBenny } from "@/utils/benny";
import type { BennyMood } from "@/types";

export function useAskBenny() {
  const { creatorToken } = useApp();

  return useCallback(
    (
      prompt: string,
      type: "checkin" | "workout" | "nutrition" | "greeting" | "cardio",
    ): Promise<{ message: string; mood: BennyMood }> => {
      return askBenny(prompt, type, creatorToken || undefined);
    },
    [creatorToken],
  );
}
