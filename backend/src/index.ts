import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { ensureUploadDir, UPLOAD_DIR } from "./upload";
import authRouter from "./auth";
import adminRouter from "./admin";
import levelsPublicRouter from "./routes/levels.public";
import attemptsRouter from "./routes/attempts";
import { pool } from "./prisma";

const app = express();
app.use(express.json());

ensureUploadDir();
app.use("/uploads", express.static(UPLOAD_DIR));

app.use(
  cors({ 
    origin: true, 
    credentials: true 
  })
);

const PgSessionStore = pgSession(session);

app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    store: new PgSessionStore({
      pool,
      createTableIfMissing: true,
    }),
  })
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

app.use("/api/admin", adminRouter);

app.use("/api/levels", levelsPublicRouter);

app.use("/api/attempts", attemptsRouter);

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});