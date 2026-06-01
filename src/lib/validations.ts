import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const moodSchema = z.object({
  score: z.number().int().min(0).max(100),
  note: z.string().max(500).optional(),
});

export const activitySchema = z.object({
  type: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  durationMinutes: z.number().int().min(1).max(24 * 60),
});

export const assessmentSubmitSchema = z.object({
  instrumentId: z.enum(["srq-29", "dass-21", "phq-9", "gad-7"]),
  answers: z.array(z.number().int().min(0)),
});

export const themeSchema = z.object({
  theme: z.enum(["light", "dark"]),
});
