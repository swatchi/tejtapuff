import { z } from "zod";
import { MAX_START_DELAY_DAYS, REASONS, SINCE, TRIGGERS } from "@/content/quiz";
import { UNITS } from "@/content/units";

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((x) => x.id) as [T[number]["id"], ...T[number]["id"][]];

export const quizAnswersSchema = z
  .object({
    unit: z.enum(ids(UNITS)),
    perMonth: z.number().min(1).max(200),
    unitPrice: z.number().min(0.5).max(100),
    since: z.enum(ids(SINCE)),
    triggers: z.array(z.enum(ids(TRIGGERS))).min(1).max(TRIGGERS.length),
    reasons: z.array(z.enum(ids(REASONS))).min(1).max(REASONS.length),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine(
    (a) => {
      const start = Date.parse(`${a.startDate}T12:00:00Z`);
      const now = Date.now();
      const day = 86_400_000;
      // 1 jour de tolérance pour les fuseaux horaires
      return start >= now - 2 * day && start <= now + (MAX_START_DELAY_DAYS + 1) * day;
    },
    { message: "Date de démarrage invalide", path: ["startDate"] },
  );

export type QuizAnswers = z.infer<typeof quizAnswersSchema>;

export const utmSchema = z
  .object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
  })
  .partial();

export type Utm = z.infer<typeof utmSchema>;
