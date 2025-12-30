import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(cors({ origin: true, credentials: true }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(4000, () => {
  console.log("API listening on http://localhost:4000");
});