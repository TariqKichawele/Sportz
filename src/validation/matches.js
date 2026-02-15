import { z } from 'zod';

// Match status constants
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

// Query schema for listing matches — optional coerced positive integer limit (max 100)
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Param schema for a single match — required coerced positive integer id
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Helper: returns true when the value is a valid ISO-8601 date string
const isValidISODate = (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
};

// Schema for creating a match
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, 'sport is required'),
    homeTeam: z.string().min(1, 'homeTeam is required'),
    awayTeam: z.string().min(1, 'awayTeam is required'),
    startTime: z.string().refine(isValidISODate, {
      message: 'startTime must be a valid ISO date string',
    }),
    endTime: z.string().refine(isValidISODate, {
      message: 'endTime must be a valid ISO date string',
    }),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'endTime must be after startTime',
      });
    }
  });

// Schema for updating match scores
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});

