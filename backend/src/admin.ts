import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireAdmin, requireAuth } from "./middlewares/auth";
import { prisma } from "./prisma";

const router: ExpressRouter = Router();

// 이 라우터 아래는 관리자만 접근 가능
router.use(requireAuth, requireAdmin);

// 권한 테스트
router.get("/health", (req, res) => {
    res.json({ ok: true, adminOnly: true });
})

// 테스트 : 관리자만 유저 목록 보기
router.get("/user", async (req, res) => {
    const users = await prisma.user.findMany({
        select: { id: true, username: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });

    res.json({ users });
});

export default router;