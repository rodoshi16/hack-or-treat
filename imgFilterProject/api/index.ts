import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { setupRoutes } from "../server/routes";
import { initDb } from "../server/pg";

// Load env from project root
dotenv.config({ path: path.resolve(process.cwd(), "imgFilterProject", ".env") });

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

// Note: Vercel serverless filesystem is ephemeral; this is best-effort only
const uploadsDir = path.resolve(process.cwd(), "imgFilterProject", "uploads");
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch {}
app.use("/uploads", express.static(uploadsDir));

setupRoutes(app);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Initialize database tables on cold start
initDb().catch(() => undefined);

export default app;


