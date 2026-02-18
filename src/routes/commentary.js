import e, { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
        res.status(400).json({ message: parsedParams.error.message });
        return;
    }

    const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        res.status(400).json({ message: parsedQuery.error.message });
        return;
    }

    try {
        const { limit = 10 } = parsedQuery.data;

        const safeLimit = Math.min(limit, MAX_LIMIT);

        const data = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, parsedParams.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(safeLimit);

        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ message: "Failed to list commentary", details: error.message });
    }
});

commentaryRouter.post("/", async (req, res) => {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
        res.status(400).json({ message: parsedParams.error.message });
        return;
    }

    const parsedBody = createCommentarySchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({ message: parsedBody.error.message });
        return;
    }

    try {
        const { minute, ...rest } = parsedBody.data;
        const [entry] = await db
            .insert(commentary)
            .values({
                minute,
                matchId: parsedParams.data.id,
                ...rest
            })
            .returning();

        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(entry.matchId, entry);
        }

        res.status(201).json({ data: entry });
    } catch (error) {
        res.status(500).json({ message: "Failed to create commentary", details: error.message });
    }
});