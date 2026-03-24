import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_TOKEN_KEY = "liftlog:deviceToken";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedToken: string | null = null;

export async function getDeviceToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (stored) {
      cachedToken = stored;
      return stored;
    }
    const newToken = generateUUID();
    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, newToken);
    cachedToken = newToken;
    return newToken;
  } catch {
    const fallback = generateUUID();
    cachedToken = fallback;
    return fallback;
  }
}

const HTML_TAG_PATTERN = /<[^>]*>/g;
const NULL_BYTE_PATTERN = /\0/g;
const UNSAFE_CHAR_PATTERN = /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g;

const MAX_LENGTHS: Record<string, number> = {
  note: 2000,
  meal: 100,
  exercise: 100,
  checkin: 1000,
  workout: 100,
  default: 500,
};

export function sanitizeInput(text: string, field: keyof typeof MAX_LENGTHS = "default"): string {
  if (typeof text !== "string") return "";
  const maxLen = MAX_LENGTHS[field] ?? MAX_LENGTHS.default;
  return text
    .replace(HTML_TAG_PATTERN, "")
    .replace(NULL_BYTE_PATTERN, "")
    .replace(UNSAFE_CHAR_PATTERN, "")
    .trim()
    .slice(0, maxLen);
}
