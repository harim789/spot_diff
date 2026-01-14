import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../prisma";
import { upload, UPLOAD_DIR } from "../upload";

const router: ExpressRouter = Router();

async function safeUnlinkByUrl(url: string | null) {
    if (!url) return;
    if (!url.startsWith("/uploads/")) return; // 로컬 업로드가 아니면 무시

    const filename = url.replace("/uploads", "");
    const filepath = path.join(UPLOAD_DIR, filename);
    
    try {
        await fs.unlink(filepath);
    } catch {
        // 없으면 무시
    }
}

/*
    GET /api/admin/levels
    관리자용: 전체 레벨 (공개/비공개 포함)
 */
router.get("/", async (_req, res) => {
    const levels = await prisma.level.findMany({
        orderBy: {createdAt: "desc"},
        select: {
            id: true,
            title: true,
            leftImageUrl: true,
            rightImageUrl: true,
            diffCount: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true,            
        },
    });

    res.json({ levels });
});

/*
    POST /api/admin/levels
    multipart/form-data:
     - title 
     - isPublished 
     - leftImage
     - rightImage
 */
router.post(
    "/",
    upload.fields([
        { name: "leftImage", maxCount: 1 },
        { name: "rightImage", maxCount: 1 },
    ]),
    async (req, res) => {
        const title = String(req.body.title || "").trim();
        const isPublished = String(req.body.isPublished || "false") === "true";

        const files = req.files as Record<string, Express.Multer.File[]> | undefined;
        const left = files?.leftImage?.[0];
        const right = files?.rightImage?.[0];

        if (!title) return res.status(400).json({ message: "title is required" });
        if (!left || ! right) {
            return res.status(400).json({ message: "left image and right image are required" });
        }

        const leftImageUrl = `/uploads/${left.filename}`;
        const rightImageUrl = `/uploads/${right.fieldname}`;

        const level = await prisma.level.create({
            data: {
                title, 
                leftImageUrl, 
                rightImageUrl, 
                isPublished,
                diffCount: 0,
            },
            select: {
                id: true,
                title: true,
                leftImageUrl: true,
                rightImageUrl: true,
                diffCount: true,
                isPublished: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.status(201).json({ level });
    }
);

/*
    PATCH /api/admin/levels/:id
     - title, isPublished : optional
     - leftImage, rightImage : optional 교체
 */
router.patch(
    "/:id",
    upload.fields([
        { name: "leftImage", maxCount: 1 },
        { name: "rightImage", maxCount: 1 },
      ]),
      async (req, res) => {
        const { id } = req.params;

        const existing = await prisma.level.findUnique({ 
            where: { id },
            select: { id: true, leftImageUrl: true, rightImageUrl: true },
        });

        if (!existing) return res.status(404).json({ message: "Level not found" });

        const title = req.body.title !== undefined ? String(req.body.title).trim() : undefined;
        const isPublished = req.body.isPublished !== undefined ? String(req.body.isPublished) === "true" : undefined;
        
        const files = req.files as Record<string, Express.Multer.File[]> | undefined;
        const left = files?.leftImage?.[0];
        const right = files?.rightImage?.[0];

        const nextLeftUrl = left ? `/uploads/${left?.fieldname}` : undefined;
        const nextRigntUrl = right ? `/uploads/${right?.filename}` : undefined;

        const updated = await prisma.level.update({
            where: { id },
            data: {
                ...(title !== undefined ? {title} : {}),
                ...(isPublished !== undefined ? { isPublished } : {}),
                ...(nextLeftUrl !== undefined ? { nextLeftUrl } : {}),
                ...(nextRigntUrl !== undefined ? { nextRigntUrl } : {}),
            },
            select: {
                id: true,
                title: true,
                leftImageUrl: true,
                rightImageUrl: true,
                diffCount: true,
                isPublished: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (nextLeftUrl) await safeUnlinkByUrl(existing.leftImageUrl);
        if (nextRigntUrl) await safeUnlinkByUrl(existing.rightImageUrl);

        res.json({ level: updated });
      }
);

/*
    DELETE /api/admin/levels/:id
    레벨 삭제 + 로컬 이미지 파일 삭제
 */
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.level.findUnique({
        where: { id },
        select: { id: true, leftImageUrl: true, rightImageUrl: true },
    });
    if (!existing) return res.status(404).json({ message: "Level not found" });

    await prisma.level.delete({ where: { id }});

    await safeUnlinkByUrl(existing.leftImageUrl);
    await safeUnlinkByUrl(existing.rightImageUrl);

    return res.json({ ok: true });
});

export default router;