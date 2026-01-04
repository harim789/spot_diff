import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import bcrypt from "bcrypt";
import z from "zod";
import { prisma } from "./prisma";

const router: ExpressRouter = Router();

const CredentialSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(6).max(50),
});

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
    const parsed = CredentialSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const { username, password } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
        return res.status(409).json({ message: "Username already exsits" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { username, passwordHash, role: "USER" },
        select: { id: true, username: true, role: true, createdAt: true },
    });

    req.session.userId = user.id;

    return res.status(201).json({ user });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    const parsed = CredentialSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "invalid input", errors: parsed.error.flatten() });
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    req.session.userId = user.id;

    return res.json({
        user: { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt },
    });
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Failed to logout" });

        // 세션 쿠키 이름이 connect.sid일 때 (express-session이 쿠키를 구울 때 사용하는 기본 이름)
        res.clearCookie("connect.sid");
        return res.json({ ok: true });
    })
})

// GET /api/auth/me
router.get("/me", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not logged in" });
  
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, createdAt: true },
    });
  
    if (!user) return res.status(401).json({ message: "Not logged in" });
  
    return res.json({ user });
});

export default router;