import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

export async function requireAuth (req: Request, res: Response, next: NextFunction) {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = prisma.user.findUnique({
        where: {id: userId},
        select: { id: true, username: true, role: true },
    });

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // 현재 로그인한 유저의 정보를 다음 단계(미들웨어)에서도 사용할 수 있도록 하기 위해
    // req라는 상자에 user 칸을 만들어서 보냄
    (req as any).user = user;

    next();
}

export async function requireAdmin (req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user as { id: string; role: "USER" | "ADMIM" };

    if (!user) return res.status(500).json({ message: "Auth middleware order error" });

    if (user.role !== "ADMIM") {
        return res.status(403).json({ message: "Forbidden" });
    }

    next();
}