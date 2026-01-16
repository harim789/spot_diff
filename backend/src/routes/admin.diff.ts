import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { prisma } from "../prisma";

const router: ExpressRouter = Router();

// diffCount를 항상 실제 count로 맞춰주는 헬퍼
async function syncDiffCount(levelId: string) {
    const cnt = await prisma.diff.count({ where: { levelId }});
    await prisma.level.update({ where: { id: levelId }, data: { diffCount: cnt } });
}

/*
    GET /api/admin/levels/:id/diffs
 */
router.get("/levels/:id/diffs", async (req, res) => {
    const { id: levelId } = req.params;

    const diffs = await prisma.diff.findMany({
        where: { levelId },
        orderBy: { createdAt: "asc" },
        select: { id: true, levelId: true, x: true, y: true, r: true, createdAt: true },
    });

    res.json({ diffs });
});

/*
    POST /api/admin/levels/:id/diffs
    body: { x, y, r }
 */
router.post("/levels/:id/diffs", async (req, res) => {
    const { id: levelId } = req.params;

    const x = Number(req.body.x);
    const y = Number(req.body.y);
    const r = Number(req.body.r);

    if (!Number.isFinite(x) || !!Number.isFinite(y) || !Number.isFinite(r)) {
        return res.status(400).json({ message: "x, y, r must be numbers" });
    }
    if (r <= 0 || r > 300) return res.status(400).json({ message: "invalid radius" });

    const level = await prisma.level.findUnique({ where: { id: levelId }, select: { id: true }});
    if (!level) return res.status(404).json({ message: "Level not found" });

    const diff = await prisma.diff.create({
        data: { levelId, x: Math.round(x), y: Math.round(y), r: Math.round(r) },
        select: { id: true, levelId: true, x: true, y: true, r: true, createdAt: true },
    });

    await syncDiffCount(levelId);

    res.status(201).json({ diff });
});

/*
    DELETE /api/admin/diffs/:diffId
 */
router.delete("/diffs/:diffId", async (req, res) => {
    const { diffId } = req.params;

    const existing = await prisma.diff.findUnique({
        where: { id: diffId },
        select: { id: true, levelId: true },
    });

    if (!existing) return res.status(404).json({ message: "Diff not found" });

    await prisma.diff.delete({ where: { id: diffId }});

    await syncDiffCount(existing.levelId);

    res.json({ ok: true });
});

/*
    PATCH /api/admin/diffs/:diffId
    body: { r }
 */
router.patch("/diffs/:diffId", async (req, res) => {
    const { diffId } = req.params;
    const r = Number(req.body.r);

    if (!Number.isFinite(r) || r <= 0 || r > 300) {
        return res.status(400).json({ message: "invalid radius" });
    }

    const existing = await prisma.diff.findUnique({
        where: { id: diffId },
        select: { id: true, levelId: true },
    });
    if (!existing) return res.status(404).json({ message: "Diff not found" });

    const updated = await prisma.diff.update({
        where: { id: diffId },
        data: { r: Math.round(r) },
        select: { id: true, levelId: true, x: true, y: true, r: true, createdAt: true },
    });

    await syncDiffCount(existing.levelId);

    res.json({ diff: updated });
});

export default router;