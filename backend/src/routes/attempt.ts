import { Router } from "express";
import type { Router as ExpressRouter } from "express"
import { requireAuth } from "../middlewares/auth";
import { prisma } from "../prisma";

const router: ExpressRouter = Router();

/*
    POST /api/attempts/start
    body: { levelId }
    res: { attemptId }
 */
router.post("/start", requireAuth, async (req, res) => {
    const userId = req.session.userId as string;
    const levelId = String(req.body.levelId || "");

    if (!levelId) return res.status(400).json({ message: "levelId is required" });

    const level = await prisma.level.findFirst({
        where: { id: levelId, isPublished: true },
        select: { id: true },
    });
    if (!level) return res.status(404).json({ message: "Level not found" });

    const attempt = await prisma.attempt.create({
        data: { userId, levelId },
        select: { id: true, startedAt: true }
    });

    res.status(201).json({ attemptId: attempt.id, startedAt: attempt.startedAt });
});

/*
    POST /api/attempts/finish
    body: { attemptId, durationMs, wrongClicks }
    res: { ok: true }
 */
router.post("/finish", requireAuth, async (req, res) => {
    const userId = req.session.userId as string;
    const attemptId = String(req.body.attemptId || "");
    const durationMs = Number(req.body.durationMs);
    const wrongClicks = Number(req.body.wrongClicks);

    if (!attemptId) return res.status(400).json({ message: "attemptId is required" });
    if (!Number.isFinite(durationMs) || durationMs < 0) {
        return res.status(400).json({ message: "durationMs invalid" });
    }
    if (!Number.isFinite(wrongClicks) || wrongClicks < 0) {
        return res.status(400).json({ message: "wrongClicks invalid" });
    }

    const attempt = await prisma.attempt.findFirst({
        where: { id: attemptId, userId },
        select: { id: true, finishedAt: true },
    });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    await prisma.attempt.update({
        where: { id: attemptId },
        data: {
            finishedAt: new Date(),
            durationMs: Math.round(durationMs),
            wrongClicks: Math.round(wrongClicks),
        },
    });

    res.json({ ok: true });
});

export default router;