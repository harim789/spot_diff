import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { prisma } from "../prisma";

const router: ExpressRouter = Router();

/*
    GET /api/levels
    isPublished=true 만 공개
    정답(diff)은 포함하면 안 됨!
*/
router.get("/", async (req, res) => {
    const levels = await prisma.level.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            leftImageUrl: true,
            rightImageUrl: true,
            diffCount: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    res.json({ levels });
});

/*
    GET /api/levels/:id
    이미지, 메타만 공개
    정답(diff)은 포함하면 안 됨!
*/
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const level = await prisma.level.findMany({
        where: { id, isPublished: true },
        select: {
            id: true,
            title: true,
            leftImageUrl: true,
            rightImageUrl: true,
            diffCount: true,
            createdAt: true,
            updatedAt: true,       
        },
    });

    if (!level) return res.status(404).json({ message: "Level not found"});

    res.json({ level });
});

export default router;