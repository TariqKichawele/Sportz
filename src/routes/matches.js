import { Router } from 'express';
import { createMatchSchema } from '../validation/matches.js';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { getMatchStatus } from '../utils/match.status.js';
import { listMatchesQuerySchema } from '../validation/matches.js';
import { desc } from 'drizzle-orm';

const MAX_LIMIT = 100;

export const matchesRouter = Router();

matchesRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.message });
        return;
    }

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

    try {
        const data = await db.select().from(matches).orderBy((desc, matches.createdAt)).limit(limit);

        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ message: 'Failed to list matches', details: error.message });
    }


});

matchesRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.message });
        return;
    }

    const { data: { startTime, endTime, homeScore, awayScore }} = parsed;

    try {
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: 0 ?? homeScore,
            awayScore: 0 ?? awayScore,
            staus: getMatchStatus(startTime, endTime)
        }).returning();

        if (res.app.locals.broadcastMatchCreated) {
            res.app.locals.broadcastMatchCreated(event);
        }

        res.status(201).json({ data: event });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create match', details: error.message });
    }

})