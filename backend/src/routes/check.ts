import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { prisma } from "../prisma";

const router: ExpressRouter = Router();

/*
    POST /api/levels/:id/check
    body: { x, y, attemptId }
    response: 
     - { hit: true, diffId } 
     - { hit: false },
     - { hit: false, alreadyFound: true } (중복 클릭인 경우)
 */
router.post("/levels/:id/check", requireAuth, async (req, res) => {
    const userId = req.session.userId as string;
    const levelId = req.params.id as string;

    const x = Number(req.body.x);
    const y = Number(req.body.y);
    const attemptId = String(req.body.attemptId || "");

    if (!attemptId) return res.status(400).json({ message: "attemptId is required" });
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return res.status(400).json({ message: "x, y must be numbers" });
    }

    // attempt 소유권 확인 + levelId 일치 확인
    const attempt = await prisma.attempt.findFirst({
        where: { id: attemptId, userId, levelId },
        select: { id: true },
    });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    const diffs = await prisma.diff.findMany({
        where: { levelId },
        select: { id: true, x: true, y: true, r: true },
    });

    let hitDiffId: string | null = null;
    for (const d of diffs) {
        const dx = x - d.x;
        const dy = y - d.y;
        if (dx*dx + dy*dy <= d.r*d.r) {
            hitDiffId = d.id;
            break;
        }
    }

    if (!hitDiffId) {
        await prisma.attempt.update({
            where: { id: attemptId },
            data: { wrongClicks: { increment: 1} },
        });
        return res.json({ hit: false });
    }

    // 중복 체크
    try {
        await prisma.foundDiff.create({
            data: { attemptId, diffId: hitDiffId },
        });

        await prisma.attempt.update({
            where: { id: attemptId },
            data: { foundCount: { increment: 1 } },
        });

        return res.json({ hit: true, diffId: hitDiffId });
    } catch {
        return res.json({ hit: false, alreadyFound: true, diffId: hitDiffId });
    }
});

export default router;