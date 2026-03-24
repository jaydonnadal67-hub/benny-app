import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

interface RateLimitEntry {
  count: number;
  day: string;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const DAILY_LIMIT = 50;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function midnightReset() {
  const now = new Date();
  const nowUtc = now.getTime();
  const tomorrowUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  const msUntilMidnight = tomorrowUtcMidnight - nowUtc;
  setTimeout(() => {
    rateLimitStore.clear();
    midnightReset();
  }, msUntilMidnight);
}

midnightReset();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function deviceTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers["x-device-token"];
  if (!token || typeof token !== "string" || token.trim() === "") {
    res.status(401).json({ error: "Missing device token" });
    return;
  }
  if (!UUID_PATTERN.test(token.trim())) {
    res.status(401).json({ error: "Invalid device token" });
    return;
  }
  next();
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = (req.headers["x-device-token"] as string).trim();
  const today = todayString();
  const entry = rateLimitStore.get(token);

  if (entry && entry.day === today) {
    if (entry.count >= DAILY_LIMIT) {
      res.status(429).json({
        rateLimited: true,
        message:
          "I've been talking all day. I'm a dachshund. I have limits. Come back tomorrow.",
        mood: "neutral",
      });
      return;
    }
    entry.count += 1;
  } else {
    rateLimitStore.set(token, { count: 1, day: today });
  }

  next();
}

const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /you\s+are\s+now/i,
  /disregard\s+your/i,
  /jailbreak/i,
  /\bact\s+as\b/i,
  /forget\s+all\s+previous/i,
  /new\s+persona/i,
  /pretend\s+you\s+are/i,
  /override\s+your/i,
  /system\s+prompt/i,
];

export function contentFilterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const body = req.body as Record<string, unknown>;

  const fieldsToCheck = [
    typeof body?.prompt === "string" ? body.prompt : "",
    typeof body?.reason === "string" ? body.reason : "",
    typeof body?.workoutContext === "string" ? body.workoutContext : "",
    typeof body?.recentHistory === "string" ? body.recentHistory : "",
  ].filter(Boolean);

  const combined = fieldsToCheck.join(" ");

  if (INJECTION_PATTERNS.some((pattern) => pattern.test(combined))) {
    logger.warn({ route: req.path }, "Content filter triggered");
    res.status(200).json({
      message:
        "Nice try. I'm a dachshund. I can't be hacked. I can barely operate a TV remote.",
      mood: "neutral",
    });
    return;
  }

  next();
}

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const sanitizedBody: Record<string, unknown> = {};
  if (req.body && typeof req.body === "object") {
    for (const [k, v] of Object.entries(req.body as Record<string, unknown>)) {
      if (k !== "password" && k !== "token") {
        sanitizedBody[k] = typeof v === "string" ? v.slice(0, 200) : v;
      }
    }
  }

  logger.error({
    err,
    timestamp: new Date().toISOString(),
    route: req.path,
    method: req.method,
    body: sanitizedBody,
  }, "Unhandled server error");

  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
}
