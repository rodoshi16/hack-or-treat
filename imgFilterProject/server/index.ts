import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one level up from server/)
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

import express from "express";
import cors from "cors";
import { initDb, pool } from "./pg";
import { setupRoutes } from "./routes";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

// API Routes
setupRoutes(app);

app.get("/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ status: "error", error: String(e) });
  }
});

app.listen(PORT, async () => {
  await initDb();
  console.log(`API listening on http://localhost:${PORT}`);
});


